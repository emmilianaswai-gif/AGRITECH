import { useEffect, useState, type FormEvent } from "react";
import { learningApi, type LearningResource, type LearningResourceType } from "../api/client";
import { useUser, roleOf } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmDialog from "./ConfirmDialog";

const PROVIDER_ROLES = ["FAMER", "ADMIN", "SUPER_ADMIN"];

type TabId = "courses" | "videos" | "calendar" | "certifications";

const TYPE_BY_TAB: Record<TabId, LearningResourceType> = {
  courses: "COURSE",
  videos: "VIDEO",
  calendar: "CALENDAR",
  certifications: "CERTIFICATION",
};

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "courses",
    label: "Interactive Courses",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "videos",
    label: "Video Tutorials & Guides",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Seasonal Crop Calendars",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: "certifications",
    label: "Certification Programs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
];

const emptyForm = {
  title: "",
  description: "",
  category: "",
  meta: "",
  progress: 0,
  status: "",
  resourceUrl: "",
};

const labelFor = {
  courses: { category: "Level", meta: "Lessons / Duration", status: "Status", url: "Course link" },
  videos: { category: "Category", meta: "Duration", status: "Status", url: "Video / YouTube link" },
  calendar: { category: "Region", meta: "Planting & Harvest seasons", status: "Status", url: "Calendar link" },
  certifications: { category: "Provider", meta: "Credits", status: "Status", url: "Program link" },
};

export default function LearningCenter() {
  const { user } = useUser();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const canProvide = PROVIDER_ROLES.includes(roleOf(user) ?? "");

  const [activeTab, setActiveTab] = useState<TabId>("courses");
  const [resources, setResources] = useState<Record<TabId, LearningResource[]>>({
    courses: [],
    videos: [],
    calendar: [],
    certifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async (type: TabId) => {
    setLoading(true);
    try {
      const data = await learningApi.getAll(TYPE_BY_TAB[type]);
      setResources((prev) => ({ ...prev, [type]: data }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load learning resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (selectedFile) {
        const data = new FormData();
        data.append("file", selectedFile);
        data.append("type", TYPE_BY_TAB[activeTab]);
        data.append("title", form.title.trim());
        if (form.description.trim()) data.append("description", form.description.trim());
        if (form.category.trim()) data.append("category", form.category.trim());
        if (form.meta.trim()) data.append("meta", form.meta.trim());
        data.append("progress", String(form.progress));
        if (form.status.trim()) data.append("status", form.status.trim());
        if (form.resourceUrl.trim()) data.append("resourceUrl", form.resourceUrl.trim());
        await learningApi.upload(data, roleOf(user) ?? "");
      } else {
        await learningApi.create({
          type: TYPE_BY_TAB[activeTab],
          title: form.title.trim(),
          description: form.description.trim() || null, category: form.category.trim() || null,
          meta: form.meta.trim() || null, progress: form.progress, status: form.status.trim() || null,
          resourceUrl: form.resourceUrl.trim() || null,
        }, roleOf(user) ?? "");
      }
      setShowForm(false);
      setForm(emptyForm);
      setSelectedFile(null);
      await load(activeTab);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const requestDelete = (id: number, name: string) => setDeleteTarget({ id, name });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await learningApi.delete(deleteTarget.id, roleOf(user) ?? "");
      setDeleteTarget(null);
      await load(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const items = resources[activeTab];
  const labels = labelFor[activeTab];
  const progressValue =
    typeof form.progress === "number" && !Number.isNaN(form.progress) ? form.progress : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-green-800 text-white shadow-md shadow-green-800/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-800"
              }`}
            >
              {tab.icon}
              <span className="inline">{tab.label}</span>
            </button>
          );
        })}
        {canProvide && (
          <button
            onClick={() => {
              setForm(emptyForm);
              setFormError("");
              setShowForm(true);
            }}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors shadow-md shadow-green-800/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="inline">Add New</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} yet.</p>
          {canProvide ? (
            <button
              onClick={() => {
                setForm(emptyForm);
                setFormError("");
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add your first one
            </button>
          ) : (
            <p className="text-xs">Farmers and admins will publish new content here.</p>
          )}
        </div>
      ) : activeTab === "courses" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((course) => (
            <div key={course.id ?? course.title} className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              {canProvide && (
              <button
                onClick={() => course.id && requestDelete(course.id, course.title)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete"
                aria-label="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              )}
              <div className="flex items-center justify-between mb-2">
                {course.category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-green-700 bg-green-50 rounded-full px-3 py-1">
                    {course.category}
                  </span>
                )}
                {course.meta && <span className="text-xs text-gray-500">{course.meta}</span>}
              </div>
              <h4 className="font-bold text-green-950 mb-1">{course.title}</h4>
              {course.description && <p className="text-sm text-gray-500 mb-3">{course.description}</p>}
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{course.progress ?? 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-4">
                <div className="h-2 bg-green-600 rounded-full" style={{ width: `${course.progress ?? 0}%` }} />
              </div>
              <a
                href={course.resourceUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className={`block w-full px-4 py-2.5 text-center ${
                  course.resourceUrl
                    ? "bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors"
                    : "bg-green-50 text-green-800 text-sm font-semibold rounded-xl"
                }`}
              >
                {(course.progress ?? 0) > 0 ? "Continue Course" : "Enroll Now"}
              </a>
            </div>
          ))}
        </div>
      ) : activeTab === "videos" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((video) => (
            <a
              key={video.id ?? video.title}
              href={video.resourceUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden block text-left"
            >
              {canProvide && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  video.id && requestDelete(video.id, video.title);
                }}
                className="absolute top-2 right-2 z-10 bg-black/40 text-white hover:text-red-400 transition-colors rounded-lg p-1.5"
                title="Delete"
                aria-label="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              )}
              <div className="relative bg-gradient-to-br from-green-700 to-green-900 h-32 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5.14v13.72L15.86 12 8 5.14z" />
                </svg>
                {video.meta && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {video.meta}
                  </span>
                )}
              </div>
              <div className="p-4">
                {video.category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-green-700">{video.category}</span>
                )}
                <p className="font-semibold text-green-950 mt-1 group-hover:text-green-700 transition-colors">{video.title}</p>
              </div>
            </a>
          ))}
        </div>
      ) : activeTab === "calendar" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-green-50 text-green-900">
                  <th className="px-5 py-3 font-semibold">Crop</th>
                  <th className="px-5 py-3 font-semibold">Seasons / Notes</th>
                  <th className="px-5 py-3 font-semibold">Region</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id ?? row.title} className="border-t border-gray-100 hover:bg-green-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
                        {row.title}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{row.meta || "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{row.category || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {canProvide && (
                      <button
                        onClick={() => row.id && requestDelete(row.id, row.title)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((cert) => (
            <div key={cert.id ?? cert.title} className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              {canProvide && (
              <button
                onClick={() => cert.id && requestDelete(cert.id, cert.title)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete"
                aria-label="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                </div>
                <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
                  cert.status === "In Progress" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {cert.status || "Available"}
                </span>
              </div>
              <h4 className="font-bold text-green-950 mb-1">{cert.title}</h4>
              {cert.category && <p className="text-sm text-gray-500 mb-3">{cert.category}</p>}
              {cert.meta && <p className="text-xs text-gray-400 mb-4">{cert.meta} training credits</p>}
              <a
                href={cert.resourceUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className={`block w-full px-4 py-2.5 text-center rounded-xl ${
                  cert.resourceUrl
                    ? "bg-green-800 text-white text-sm font-semibold hover:bg-green-900 transition-colors"
                    : "bg-green-50 text-green-800 text-sm font-semibold"
                }`}
              >
                {cert.status === "In Progress" ? "View Progress" : "Start Program"}
              </a>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-green-950">
                Add {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
              <button onClick={() => !saving && setShowForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sustainable Maize Farming"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Short summary of this item..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{labels.category}</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder={activeTab === "courses" ? "e.g. Beginner" : activeTab === "videos" ? "e.g. Soil" : activeTab === "calendar" ? "e.g. Highlands" : "e.g. AgriConnect Academy"}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{labels.meta}</label>
                  <input
                    type="text"
                    value={form.meta}
                    onChange={(e) => setForm({ ...form, meta: e.target.value })}
                    placeholder={activeTab === "calendar" ? 'e.g. Plant: Mar-May | Harvest: Aug-Oct' : activeTab === "courses" ? "e.g. 12 lessons · 4h 30m" : "e.g. 8:24"}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Progress %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressValue}
                    onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{labels.status}</label>
                  <input
                    type="text"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    placeholder={activeTab === "certifications" ? "e.g. Available / In Progress" : "e.g. Published"}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Upload from your device</label>
                <label
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${
                    selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-green-400 hover:bg-green-50/50"
                  }`}
                >
                  {selectedFile ? (
                    <>
                      <span className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-green-800 break-all text-center">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB · click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </span>
                      <span className="text-sm text-gray-600">Click to choose a file — tutorial video, document, or image</span>
                      <span className="text-xs text-gray-400">MP4, PDF, JPG, PNG…</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="mt-1.5 text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove file
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Tip: upload the tutorial from your device, or use the link field below instead.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{labels.url} (optional)</label>
                <input
                  type="url"
                  value={form.resourceUrl}
                  onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Delete content?"
        message={
          <>
            Delete <b>{deleteTarget?.name ?? "this item"}</b>? It will be removed for everyone.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
