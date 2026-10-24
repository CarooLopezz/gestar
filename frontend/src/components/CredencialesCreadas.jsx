// Muestra el usuario y la contraseña de una cuenta recién creada. Aparece
// siempre, aunque el mail haya salido, por si no llega o cae en spam.
export default function CredencialesCreadas({ nombre, email, contrasena, mailEnviado, children }) {
  return (
    <div role="status" className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
      <p className="font-medium text-green-800">✓ {nombre} quedó registrada/o.</p>
      <div className="bg-white rounded-lg border border-green-100 px-4 py-3 text-sm space-y-1">
        <p>
          <span className="text-gray-500">Usuario:</span> <span className="font-medium text-gray-800">{email}</span>
        </p>
        <p>
          <span className="text-gray-500">Contraseña:</span>{" "}
          <span className="font-mono font-semibold text-gray-800 text-base select-all">{contrasena}</span>
        </p>
      </div>
      <p className="text-sm text-gray-600">
        {mailEnviado
          ? `Le mandamos estos datos por mail a ${email}. Si no le llega, que revise la carpeta de spam o pasáselos vos.`
          : "No pudimos mandar el mail: pasale estos datos en persona. Después la puede cambiar desde \"Cambiar contraseña\"."}
      </p>
      {children}
    </div>
  );
}
