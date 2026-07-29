export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`toast fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-[100] ${
        toast.success ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {toast.message}
    </div>
  );
}
