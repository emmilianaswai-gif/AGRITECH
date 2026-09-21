import Navbar from "./components/Navbar";
import AppSidebar from "./components/AppSidebar";
import ServiceScreen from "./components/ServiceScreen";
import MobileTabBar from "./components/MobileTabBar";
import Footer from "./components/Footer";
import GetStartedModal from "./components/GetStartedModal";
import LoginScreen from "./components/LoginScreen";
import FirstLoginChangePassword from "./components/FirstLoginChangePassword";
import { GetStartedProvider } from "./context/GetStartedContext";
import { ServicesProvider } from "./context/ServicesContext";
import { UserProvider, useUser } from "./context/UserContext";
import { AccessProvider } from "./context/AccessContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useTheme } from "./context/ThemeContext";

function Shell() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      className={`min-h-screen font-sans text-gray-900 antialiased overflow-x-hidden transition-colors ${
        dark ? "bg-[#0b1410] text-gray-100" : "bg-[#f6f9f4]"
      }`}
    >
      <Navbar />
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 min-w-0 pt-14 pb-32 md:pb-28 px-4 lg:px-8">
          <ServiceScreen />
        </main>
      </div>
      <Footer />
      <MobileTabBar />
      <GetStartedModal />
    </div>
  );
}

function Gate() {
  const { user } = useUser();
  if (!user) {
    return (
      <>
        <LoginScreen />
        <GetStartedModal />
      </>
    );
  }
  if (user && user.mustChangePassword) {
    return <FirstLoginChangePassword />;
  }
  return <Shell />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <AccessProvider>
            <GetStartedProvider>
              <ServicesProvider>
                <Gate />
              </ServicesProvider>
            </GetStartedProvider>
          </AccessProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}