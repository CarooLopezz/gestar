export default function ConfirmLogoutModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🚪</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Cerrar sesión?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Vas a salir de tu cuenta. Vas a tener que ingresar tus datos de nuevo para volver a entrar.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}