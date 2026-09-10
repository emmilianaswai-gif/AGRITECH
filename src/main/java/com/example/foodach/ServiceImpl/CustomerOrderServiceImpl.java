package com.example.foodach.ServiceImpl;

import com.example.foodach.DTO.CollectionRequestDTO;
import com.example.foodach.DTO.CustomerOrderRequestDTO;
import com.example.foodach.DTO.CustomerOrderResponseDTO;
import com.example.foodach.DTO.InventoryTotalsDTO;
import com.example.foodach.DTO.TradingStatsDTO;
import com.example.foodach.Entity.CustomerOrder;
import com.example.foodach.Entity.InventoryItem;
import com.example.foodach.Repository.CustomerOrderRepository;
import com.example.foodach.Repository.InventoryItemRepository;
import com.example.foodach.Service.CustomerOrderService;
import com.example.foodach.Service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final InventoryItemRepository inventoryRepository;
    private final WalletService walletService;

    private boolean countsAsSale(CustomerOrder o) {
        String s = o.getStatus();
        return !("Requested".equalsIgnoreCase(s)
                || "Pending".equalsIgnoreCase(s)
                || "Rejected".equalsIgnoreCase(s));
    }

    private boolean holdsStock(CustomerOrder o) {
        String s = o.getStatus();
        return !("Requested".equalsIgnoreCase(s)
                || "Pending".equalsIgnoreCase(s)
                || "Rejected".equalsIgnoreCase(s));
    }

    private boolean hasCollectedStatus(CustomerOrder o) {
        String s = o.getStatus();
        return "Paid".equalsIgnoreCase(s) || "Approved".equalsIgnoreCase(s);
    }

    private void deductStock(InventoryItem item, Double qty) {
        double available = item.getQuantity() == null ? 0.0 : item.getQuantity();
        double q = qty == null ? 0.0 : qty;
        if (q > available) {
            throw new IllegalArgumentException("Insufficient stock: only " + available + " " + item.getUnit() + " available");
        }
        item.setQuantity(Math.round((available - q) * 100.0) / 100.0);
        inventoryRepository.save(item);
    }

    private void restoreStock(InventoryItem item, Double qty) {
        double restored = (item.getQuantity() == null ? 0.0 : item.getQuantity()) + (qty == null ? 0.0 : qty);
        item.setQuantity(Math.round(restored * 100.0) / 100.0);
        inventoryRepository.save(item);
    }

    @Override
    @Transactional
    public CustomerOrderResponseDTO addOrder(CustomerOrderRequestDTO requestDTO) {
        if (requestDTO.inventoryItemId() == null) {
            throw new IllegalArgumentException("Inventory item is required");
        }
        if (requestDTO.customer() == null || requestDTO.customer().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (requestDTO.quantity() == null || requestDTO.quantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        InventoryItem item = inventoryRepository.findById(requestDTO.inventoryItemId())
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        double available = item.getQuantity() == null ? 0.0 : item.getQuantity();
        if (requestDTO.quantity() > available) {
            throw new IllegalArgumentException("Insufficient stock: only " + available + " " + item.getUnit() + " available");
        }

        String paymentMethod = trimToNull(requestDTO.paymentMethod());
        boolean buyerProvided = requestDTO.customerUserId() != null && !requestDTO.customerUserId().isBlank();
        boolean isRequest = buyerProvided
                && (paymentMethod == null
                    || "Request".equalsIgnoreCase(paymentMethod)
                    || "Request Order".equalsIgnoreCase(paymentMethod));
        if (!isRequest) {
            item.setQuantity(available - requestDTO.quantity());
            inventoryRepository.save(item);
        }

        double unitPrice = item.getSellingPrice();
        double costPrice = item.getCostPrice();
        double total = Math.round(requestDTO.quantity() * unitPrice * 100.0) / 100.0;
        double profit = Math.round(requestDTO.quantity() * (unitPrice - costPrice) * 100.0) / 100.0;

        CustomerOrder order = new CustomerOrder();
        order.setInventoryItemId(item.getId());
        order.setItemTitle(item.getTitle());
        order.setCustomer(requestDTO.customer().trim());
        order.setCustomerUserId(requestDTO.customerUserId());
        order.setSellerUserId(requestDTO.sellerUserId());
        order.setQuantity(requestDTO.quantity());
        order.setUnit(item.getUnit());
        order.setUnitPrice(unitPrice);
        order.setCostPrice(costPrice);
        order.setTotal(total);
        order.setProfit(profit);
        order.setStatus(isRequest ? "Requested" : (requestDTO.status() == null ? "Paid" : requestDTO.status()));
        order.setCreatedAt(Instant.now());

        if ("Credit".equalsIgnoreCase(paymentMethod)) {
            if (requestDTO.phone() == null || requestDTO.phone().isBlank()) {
                throw new IllegalArgumentException("Phone number is required for credit sales");
            }
            if (requestDTO.location() == null || requestDTO.location().isBlank()) {
                throw new IllegalArgumentException("Location is required for credit sales — capture the customer's GPS location");
            }
            order.setStatus("Credit");
            order.setPaymentMethod("Credit");
        } else if ("Check".equalsIgnoreCase(paymentMethod)) {
            order.setStatus("Paid");
            order.setPaymentMethod("Check");
        } else if ("Online".equalsIgnoreCase(paymentMethod)) {
            order.setStatus("Paid");
            order.setPaymentMethod("Online");
        } else if ("Pending".equalsIgnoreCase(paymentMethod)) {
            order.setStatus("Pending");
            order.setPaymentMethod("Pending");
        } else {
            order.setStatus(isRequest ? "Requested" : (requestDTO.status() == null ? "Paid" : requestDTO.status()));
            order.setPaymentMethod(isRequest ? "Request" : (trimToNull(paymentMethod) == null ? "Cash" : paymentMethod));
        }

        order.setCustomerPhone(trimToNull(requestDTO.phone()));
        order.setCustomerLocation(trimToNull(requestDTO.location()));
        order.setLatitude(requestDTO.latitude());
        order.setLongitude(requestDTO.longitude());

        CustomerOrder saved = orderRepository.save(order);
        if (hasCollectedStatus(saved) && !isRequest && saved.getTotal() != null && saved.getTotal() > 0) {
            walletService.creditOrder(saved.getId(), saved.getTotal(), "SALE",
                    "Sale — " + saved.getItemTitle() + " to " + saved.getCustomer());
        }
        return mapToResponseDTO(saved);
    }

    @Override
    public List<CustomerOrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerOrderResponseDTO getOrderById(Long id) {
        return orderRepository.findById(id)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (holdsStock(order)) {
            InventoryItem item = inventoryRepository.findById(order.getInventoryItemId()).orElse(null);
            if (item != null) {
                restoreStock(item, order.getQuantity());
            }
        }

        walletService.reverseOrder(id);
        orderRepository.delete(order);
    }

    @Override
    public InventoryTotalsDTO getProfitSummary() {
        List<InventoryItem> inventory = inventoryRepository.findAll();
        long inventoryCount = inventory.size();
        double inventoryValue = inventory.stream()
                .mapToDouble(item -> (item.getQuantity() == null ? 0.0 : item.getQuantity())
                        * (item.getSellingPrice() == null ? 0.0 : item.getSellingPrice()))
                .sum();

        List<CustomerOrder> orders = orderRepository.findAll();
        long orderCount = orders.size();
        double totalSales = orders.stream()
                .filter(this::countsAsSale)
                .mapToDouble(o -> o.getTotal() == null ? 0.0 : o.getTotal()).sum();
        double totalProfit = orders.stream()
                .filter(this::countsAsSale)
                .mapToDouble(o -> o.getProfit() == null ? 0.0 : o.getProfit()).sum();

        return new InventoryTotalsDTO(
                inventoryCount,
                Math.round(inventoryValue * 100.0) / 100.0,
                orderCount,
                Math.round(totalSales * 100.0) / 100.0,
                Math.round(totalProfit * 100.0) / 100.0
        );
    }

    @Override
    public TradingStatsDTO getTradingStats() {
        List<CustomerOrder> orders = orderRepository.findAll();
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        ZonedDateTime startOfToday = today.atStartOfDay(zone);
        ZonedDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay(zone);
        ZonedDateTime startOfSixMonths = today.minusMonths(6).atStartOfDay(zone);
        ZonedDateTime startOfYear = today.withDayOfYear(1).atStartOfDay(zone);

        double todaySales = 0, todayProfit = 0;
        double monthSales = 0, monthProfit = 0;
        double sixMonthSales = 0, sixMonthProfit = 0;
        double yearSales = 0, yearProfit = 0;
        double allTimeSales = 0, allTimeProfit = 0;
        double cashCollected = 0, checkCollected = 0, outstandingDebt = 0, pendingTotal = 0;
        long debtCount = 0;

        for (CustomerOrder o : orders) {
            if (!countsAsSale(o)) {
                continue;
            }
            double total = o.getTotal() == null ? 0.0 : o.getTotal();
            double profit = o.getProfit() == null ? 0.0 : o.getProfit();

            allTimeSales += total;
            allTimeProfit += profit;

            Instant created = o.getCreatedAt();
            if (created != null) {
                ZonedDateTime t = created.atZone(zone);
                if (!t.isBefore(startOfToday)) {
                    todaySales += total;
                    todayProfit += profit;
                }
                if (!t.isBefore(startOfMonth)) {
                    monthSales += total;
                    monthProfit += profit;
                }
                if (!t.isBefore(startOfSixMonths)) {
                    sixMonthSales += total;
                    sixMonthProfit += profit;
                }
                if (!t.isBefore(startOfYear)) {
                    yearSales += total;
                    yearProfit += profit;
                }
            }

            String method = o.getPaymentMethod() == null ? o.getStatus() : o.getPaymentMethod();
            if (method == null) {
                method = "Cash";
            }
            switch (method) {
                case "Credit" -> {
                    outstandingDebt += total;
                    debtCount++;
                }
                case "Pending" -> pendingTotal += total;
                case "Check" -> checkCollected += total;
                default -> cashCollected += total;
            }
        }

        return new TradingStatsDTO(
                r2(todaySales), r2(todayProfit),
                r2(monthSales), r2(monthProfit),
                r2(sixMonthSales), r2(sixMonthProfit),
                r2(yearSales), r2(yearProfit),
                r2(allTimeSales), r2(allTimeProfit),
                r2(cashCollected), r2(checkCollected),
                r2(outstandingDebt), r2(pendingTotal),
                debtCount
        );
    }

    @Override
    @Transactional
    public CustomerOrderResponseDTO collectDebt(Long id, CollectionRequestDTO requestDTO) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        String current = order.getPaymentMethod() == null ? order.getStatus() : order.getPaymentMethod();
        if (!"Credit".equalsIgnoreCase(current)) {
            throw new IllegalArgumentException("This order is not an outstanding debt");
        }
        String method = requestDTO == null ? null : requestDTO.paymentMethod();
        if (method == null || !(method.equalsIgnoreCase("Cash") || method.equalsIgnoreCase("Check"))) {
            throw new IllegalArgumentException("Choose how the debt was paid: Cash or Check");
        }
        order.setPaymentMethod(method.equalsIgnoreCase("Cash") ? "Cash" : "Check");
        order.setStatus("Paid");
        CustomerOrder saved = orderRepository.save(order);
        if (saved.getTotal() != null && saved.getTotal() > 0) {
            walletService.creditOrder(saved.getId(), saved.getTotal(), "DEBT_PAID",
                    "Debt collected — " + saved.getCustomer());
        }
        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public CustomerOrderResponseDTO updateOrderStatus(Long id, String status) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String current = order.getStatus();
        if ("Credit".equalsIgnoreCase(current)) {
            throw new IllegalArgumentException("This order is an outstanding debt — settle it from the Debts page instead");
        }

        String target = status == null ? null : status.trim();
        if (target == null || target.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        InventoryItem item = inventoryRepository.findById(order.getInventoryItemId()).orElse(null);
        boolean deduced = holdsStock(order);
        boolean credited = walletService.wasCredited(order.getId());
        CustomerOrder saved;

        switch (target) {
            case "Approved" -> {
                if (!("Requested".equalsIgnoreCase(current) || "Pending".equalsIgnoreCase(current))) {
                    throw new IllegalArgumentException("Only requested or pending orders can be approved");
                }
                if (!deduced && item != null) {
                    deductStock(item, order.getQuantity());
                }
                order.setStatus("Approved");
                String method = order.getPaymentMethod();
                if (method == null || "Request".equalsIgnoreCase(method) || "Request Order".equalsIgnoreCase(method)) {
                    order.setPaymentMethod("Cash");
                }
                saved = orderRepository.save(order);
                if (saved.getTotal() != null && saved.getTotal() > 0) {
                    walletService.creditOrder(saved.getId(), saved.getTotal(), "SALE",
                            "Approved sale — " + saved.getItemTitle() + " to " + saved.getCustomer());
                }
            }
            case "Rejected" -> {
                if (!("Requested".equalsIgnoreCase(current)
                        || "Pending".equalsIgnoreCase(current)
                        || "Approved".equalsIgnoreCase(current)
                        || "Paid".equalsIgnoreCase(current)
                        || current == null)) {
                    throw new IllegalArgumentException("This order cannot be rejected");
                }
                if (deduced && item != null) {
                    restoreStock(item, order.getQuantity());
                }
                order.setStatus("Rejected");
                saved = orderRepository.save(order);
                if (credited && saved.getTotal() != null && saved.getTotal() > 0) {
                    walletService.refundOrder(saved.getId(), saved.getTotal(),
                            "Refund to " + saved.getCustomer() + " — order rejected");
                }
            }
            case "Pending" -> {
                if (!("Requested".equalsIgnoreCase(current) || "Rejected".equalsIgnoreCase(current))) {
                    throw new IllegalArgumentException("Only requested or rejected orders can be set to pending");
                }
                order.setStatus("Pending");
                saved = orderRepository.save(order);
            }
            default -> throw new IllegalArgumentException("Status must be Approved, Rejected or Pending");
        }

        return mapToResponseDTO(saved);
    }

    private CustomerOrderResponseDTO mapToResponseDTO(CustomerOrder order) {
        return new CustomerOrderResponseDTO(
                order.getId(),
                order.getInventoryItemId(),
                order.getItemTitle(),
                order.getCustomer(),
                order.getCustomerUserId(),
                order.getSellerUserId(),
                order.getQuantity(),
                order.getUnit(),
                order.getUnitPrice(),
                order.getCostPrice(),
                order.getTotal(),
                order.getProfit(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getCustomerPhone(),
                order.getCustomerLocation(),
                order.getLatitude(),
                order.getLongitude(),
                order.getCreatedAt()
        );
    }

    private double r2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}