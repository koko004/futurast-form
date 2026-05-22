import { useState, useEffect } from "react";

interface Inscripcion {
  fechaInscripcion: string;
  nombreNina: string;
  apellidosNina: string;
  fechaNacimiento: string;
  dniNina: string;
  nombreTutor: string;
  apellidosTutor: string;
  emailTutor: string;
  telefonoTutor: string;
  federada: "Sí" | "No";
  club: string;
  categoria: string;
  talla: string;
  intolerancias: string;
  observaciones: string;
  aceptaImagenes: boolean;
}

export default function App() {
  const [formData, setFormData] = useState<Inscripcion>({
    fechaInscripcion: "",
    nombreNina: "",
    apellidosNina: "",
    fechaNacimiento: "",
    dniNina: "",
    nombreTutor: "",
    apellidosTutor: "",
    emailTutor: "",
    telefonoTutor: "",
    federada: "No",
    club: "",
    categoria: "",
    talla: "",
    intolerancias: "",
    observaciones: "",
    aceptaImagenes: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inscritas, setInscritas] = useState<Inscripcion[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    user: "",
    password: "",
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setEmailSettings({ user: data.user, password: data.password || "" });
        }
      })
      .catch(err => console.error("Error loading settings", err));
  }, []);

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      setShowEmailSettings(false);
    } catch (err) {
      console.error("Error saving settings", err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("futurast_inscritas");
    if (stored) {
      setInscritas(JSON.parse(stored));
    }
  }, []);

  const validateDNI = (dni: string) => {
    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    return dniRegex.test(dni);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreNina.trim()) newErrors.nombreNina = "Requerido";
    if (!formData.apellidosNina.trim()) newErrors.apellidosNina = "Requerido";
    if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "Requerido";
    if (!formData.dniNina.trim()) {
      newErrors.dniNina = "Requerido";
    } else if (!validateDNI(formData.dniNina)) {
      newErrors.dniNina = "Formato DNI inválido (8 números + letra)";
    }
    if (!formData.nombreTutor.trim()) newErrors.nombreTutor = "Requerido";
    if (!formData.apellidosTutor.trim()) newErrors.apellidosTutor = "Requerido";
    if (!formData.emailTutor.trim()) {
      newErrors.emailTutor = "Requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailTutor)) {
      newErrors.emailTutor = "Email inválido";
    }
    if (!formData.telefonoTutor.trim()) {
      newErrors.telefonoTutor = "Requerido";
    } else if (!/^[6789]\d{8}$/.test(formData.telefonoTutor.replace(/\s/g, ""))) {
      newErrors.telefonoTutor = "Teléfono inválido";
    }
    if (!formData.talla) newErrors.talla = "Selecciona una talla";

    if (formData.federada === "Sí") {
      if (!formData.club.trim()) newErrors.club = "Indica el club";
      if (!formData.categoria.trim()) newErrors.categoria = "Indica la categoría";
    }

    if (!formData.aceptaImagenes) {
      newErrors.aceptaImagenes = "Debes aceptar las condiciones legales";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector(".border-red-500");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const nuevaInscripcion: Inscripcion = {
      ...formData,
      fechaInscripcion: new Date().toLocaleString("es-ES"),
      dniNina: formData.dniNina.toUpperCase(),
    };

    const updated = [...inscritas, nuevaInscripcion];
    setInscritas(updated);
    localStorage.setItem("futurast_inscritas", JSON.stringify(updated));

    // Realizar POST al backend para guardar en CSV
    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevaInscripcion)
      });
    } catch (error) {
      console.error("Error guardando en CSV", error);
    }

    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset form
    setFormData({
      fechaInscripcion: "",
      nombreNina: "",
      apellidosNina: "",
      fechaNacimiento: "",
      dniNina: "",
      nombreTutor: "",
      apellidosTutor: "",
      emailTutor: "",
      telefonoTutor: "",
      federada: "No",
      club: "",
      categoria: "",
      talla: "",
      intolerancias: "",
      observaciones: "",
      aceptaImagenes: false,
    });

    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "CwF4616RGxru") {
      setShowAdmin(true);
      setShowPasswordModal(false);
      setAdminPassword("");
      setPasswordError("");
    } else {
      setPasswordError("Contraseña incorrecta");
    }
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta inscripción?")) return;

    const newInscritas = [...inscritas];
    newInscritas.splice(index, 1);
    
    setInscritas(newInscritas);
    localStorage.setItem("futurast_inscritas", JSON.stringify(newInscritas));

    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index })
      });
    } catch (error) {
      console.error("Error al eliminar", error);
    }
  };

  const tallas = ["5-6 años", "7-8 años", "9-10 años", "11-12 años", "13-14 años", "XS", "S", "M", "L", "XL"];

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-5 flex items-start gap-4 max-w-md">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">¡Inscripción completada!</h4>
              <p className="text-sm text-gray-600 mt-0.5">La jugadora ha sido registrada correctamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Acceso Área Privada</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${passwordError ? "border-red-500 bg-red-50" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                  placeholder="Introduce la contraseña"
                  autoFocus
                />
                {passwordError && <p className="text-xs text-red-600 mt-1.5">{passwordError}</p>}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setAdminPassword("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0055A4] text-white rounded-xl font-medium hover:bg-[#00448a] transition-colors"
                >
                  Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Settings Modal */}
      {showEmailSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración Servidor Email</h3>
            <form onSubmit={handleSaveEmailSettings}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Usuario SMTP</label>
                  <input
                    type="email"
                    value={emailSettings.user}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, user: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all"
                    placeholder="ejemplo@gmail.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña (Aplicación)</label>
                  <input
                    type="password"
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all"
                    placeholder="Contraseña de aplicación de Gmail"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowEmailSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0055A4] text-white rounded-xl font-medium hover:bg-[#00448a] transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-4">
              <img src="/images/logo-transparente.png" alt="RFFPA" className="h-12 w-auto" />
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">Real Federación de Fútbol</p>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 -mt-1">Principado de Asturias</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (showAdmin) {
                    setShowAdmin(false);
                  } else {
                    setShowPasswordModal(true);
                  }
                }}
                className="text-sm text-gray-600 hover:text-[#0055A4] font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                {showAdmin ? "Volver al formulario" : `Inscritas (${inscritas.length})`}
              </button>
              <div className="w-px h-6 bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">Patrocina</span>
                <img src="/images/logo-gam.png" alt="GAM" className="h-6 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {showAdmin ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Panel de Inscritas</h2>
                <p className="text-sm text-gray-500 mt-1">Total: {inscritas.length} jugadoras registradas</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailSettings(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurar Email
                </button>
                <button
                  onClick={() => window.location.href = '/api/inscritas.csv'}
                  disabled={inscritas.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0055A4] text-white rounded-xl font-medium hover:bg-[#00448a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar inscritas.csv
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {inscritas.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Aún no hay inscripciones</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50/70">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jugadora</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Edad</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tutor</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contacto</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Federada</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Talla</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inscritas.map((ins, idx) => {
                      const edad = new Date().getFullYear() - new Date(ins.fechaNacimiento).getFullYear();
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{ins.nombreNina} {ins.apellidosNina}</div>
                            <div className="text-xs text-gray-500">DNI: {ins.dniNina}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{edad} años</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{ins.nombreTutor} {ins.apellidosTutor}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{ins.emailTutor}</div>
                            <div className="text-xs text-gray-500">{ins.telefonoTutor}</div>
                          </td>
                          <td className="px-6 py-4">
                            {ins.federada === "Sí" ? (
                              <div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Sí</span>
                                <div className="text-xs text-gray-500 mt-1">{ins.club}</div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FFC700]/20 text-[#8a6500]">{ins.talla}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(idx)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Eliminar inscripción"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <main>
          {/* Hero */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0">
              <img src="/images/hero-futurast.jpg" alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0055A4] via-[#0055A4]/95 to-[#0055A4]/80" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="text-white">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
                    <span className="w-2 h-2 bg-[#FFC700] rounded-full animate-pulse" />
                    <span className="text-xs font-medium tracking-wide uppercase">Jornada Fútbol Femenino</span>
                  </div>
                  
                  <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[0.9] mb-4">
                    OBJETIVO
                    <span className="block text-[#FFC700] mt-1">FUTUR<span className="italic">AST</span></span>
                  </h1>
                  
                  <p className="text-lg text-blue-50/90 leading-relaxed max-w-xl mb-8">
                    Inscripción oficial para la jornada de promoción del fútbol femenino base en Asturias. Una iniciativa de la RFFPA para impulsar el talento de las futuras estrellas.
                  </p>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-200">Fecha</div>
                        <div className="font-semibold">6 de Junio</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-200">Horario</div>
                        <div className="font-semibold">10:00 a 14:00h</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-200">Precio</div>
                        <div className="font-semibold">Gratuito</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-200">Categorías</div>
                        <div className="font-semibold">Hasta 12 años</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-200">Plazas</div>
                        <div className="font-semibold">Limitadas</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex justify-end">
                  <img src="/images/logo-futurast.png" alt="FUTURAST" className="w-[420px] h-auto drop-shadow-2xl opacity-90 invert brightness-0 saturate-0" style={{ filter: "brightness(0) invert(1)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 lg:-mt-12 relative z-10 pb-20">
            <div className="bg-white rounded-[32px] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                {/* Form Content */}
                <div className="p-6 sm:p-10 lg:p-12">
                  <div className="max-w-2xl">
                    <div className="mb-10">
                      <h2 className="text-[28px] font-semibold text-gray-900 tracking-tight">Formulario de inscripción</h2>
                      <p className="text-gray-500 mt-2">Completa todos los datos de la jugadora y del tutor legal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                      {/* Jugadora */}
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-[#0055A4] text-white flex items-center justify-center font-semibold text-sm">1</div>
                          <h3 className="text-lg font-semibold text-gray-900">Datos de la jugadora</h3>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                            <input
                              type="text"
                              name="nombreNina"
                              value={formData.nombreNina}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.nombreNina ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="María"
                            />
                            {errors.nombreNina && <p className="text-xs text-red-600 mt-1.5">{errors.nombreNina}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellidos *</label>
                            <input
                              type="text"
                              name="apellidosNina"
                              value={formData.apellidosNina}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.apellidosNina ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="García López"
                            />
                            {errors.apellidosNina && <p className="text-xs text-red-600 mt-1.5">{errors.apellidosNina}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de nacimiento *</label>
                            <input
                              type="date"
                              name="fechaNacimiento"
                              value={formData.fechaNacimiento}
                              onChange={handleChange}
                              max={new Date().toISOString().split('T')[0]}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.fechaNacimiento ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                            />
                            {errors.fechaNacimiento && <p className="text-xs text-red-600 mt-1.5">{errors.fechaNacimiento}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI *</label>
                            <input
                              type="text"
                              name="dniNina"
                              value={formData.dniNina}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.dniNina ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all uppercase`}
                              placeholder="12345678A"
                              maxLength={9}
                            />
                            {errors.dniNina && <p className="text-xs text-red-600 mt-1.5">{errors.dniNina}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Tutor */}
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-[#0055A4] text-white flex items-center justify-center font-semibold text-sm">2</div>
                          <h3 className="text-lg font-semibold text-gray-900">Datos del padre, madre o tutor</h3>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                            <input
                              type="text"
                              name="nombreTutor"
                              value={formData.nombreTutor}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.nombreTutor ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="Laura"
                            />
                            {errors.nombreTutor && <p className="text-xs text-red-600 mt-1.5">{errors.nombreTutor}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellidos *</label>
                            <input
                              type="text"
                              name="apellidosTutor"
                              value={formData.apellidosTutor}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.apellidosTutor ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="García López"
                            />
                            {errors.apellidosTutor && <p className="text-xs text-red-600 mt-1.5">{errors.apellidosTutor}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                            <input
                              type="email"
                              name="emailTutor"
                              value={formData.emailTutor}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.emailTutor ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="laura@email.com"
                            />
                            {errors.emailTutor && <p className="text-xs text-red-600 mt-1.5">{errors.emailTutor}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
                            <input
                              type="tel"
                              name="telefonoTutor"
                              value={formData.telefonoTutor}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.telefonoTutor ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                              placeholder="612 345 678"
                            />
                            {errors.telefonoTutor && <p className="text-xs text-red-600 mt-1.5">{errors.telefonoTutor}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Deportivo */}
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-[#0055A4] text-white flex items-center justify-center font-semibold text-sm">3</div>
                          <h3 className="text-lg font-semibold text-gray-900">Información deportiva</h3>
                        </div>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">¿La niña está federada en algún club? *</label>
                            <div className="flex gap-3">
                              {["Sí", "No"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, federada: opt as "Sí" | "No", club: opt === "No" ? "" : prev.club, categoria: opt === "No" ? "" : prev.categoria }))}
                                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                                    formData.federada === opt
                                      ? "border-[#0055A4] bg-[#0055A4]/5 text-[#0055A4]"
                                      : "border-gray-200 bg-gray-50/50 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {formData.federada === "Sí" && (
                            <div className="grid sm:grid-cols-2 gap-5 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Club *</label>
                                <input
                                  type="text"
                                  name="club"
                                  value={formData.club}
                                  onChange={handleChange}
                                  className={`w-full px-4 py-3 rounded-xl border ${errors.club ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                                  placeholder="Ej: Real Oviedo Femenino"
                                />
                                {errors.club && <p className="text-xs text-red-600 mt-1.5">{errors.club}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría *</label>
                                <input
                                  type="text"
                                  name="categoria"
                                  value={formData.categoria}
                                  onChange={handleChange}
                                  className={`w-full px-4 py-3 rounded-xl border ${errors.categoria ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                                  placeholder="Ej: Alevín"
                                />
                                {errors.categoria && <p className="text-xs text-red-600 mt-1.5">{errors.categoria}</p>}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Talla de camiseta *</label>
                            <select
                              name="talla"
                              value={formData.talla}
                              onChange={handleChange}
                              className={`w-full px-4 py-3 rounded-xl border ${errors.talla ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"} focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all`}
                            >
                              <option value="">Selecciona talla</option>
                              {tallas.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {errors.talla && <p className="text-xs text-red-600 mt-1.5">{errors.talla}</p>}
                            <p className="text-xs text-gray-500 mt-2">Patrocinada por XANA</p>
                          </div>
                        </div>
                      </div>

                      {/* Adicional */}
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-[#0055A4] text-white flex items-center justify-center font-semibold text-sm">4</div>
                          <h3 className="text-lg font-semibold text-gray-900">Información adicional</h3>
                        </div>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Intolerancias alimenticias</label>
                            <textarea
                              name="intolerancias"
                              value={formData.intolerancias}
                              onChange={handleChange}
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all resize-none"
                              placeholder="Ej: Sin gluten, lactosa..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Otras observaciones</label>
                            <textarea
                              name="observaciones"
                              value={formData.observaciones}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 focus:border-[#0055A4] transition-all resize-none"
                              placeholder="Información relevante para la organización..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100 space-y-6">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="flex items-center h-6 mt-0.5">
                            <input
                              type="checkbox"
                              name="aceptaImagenes"
                              checked={formData.aceptaImagenes}
                              onChange={(e) => setFormData(prev => ({ ...prev, aceptaImagenes: e.target.checked }))}
                              className={`w-5 h-5 rounded border-2 ${errors.aceptaImagenes ? 'border-red-500' : 'border-gray-300'} text-[#0055A4] focus:ring-[#0055A4] transition-colors cursor-pointer group-hover:border-[#0055A4]`}
                            />
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            Autorizo la toma de imágenes y vídeos durante la jornada y su publicación en las redes sociales y canales oficiales de la RFFPA con fines promocionales. *
                            {errors.aceptaImagenes && <p className="text-xs text-red-600 mt-1">{errors.aceptaImagenes}</p>}
                          </div>
                        </label>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#0055A4] text-white rounded-2xl font-semibold hover:bg-[#00448a] active:scale-[0.98] transition-all shadow-lg shadow-[#0055A4]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Enviando inscripción...
                            </>
                          ) : (
                            <>
                              <span>Enviar inscripción</span>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                          Al enviar, aceptas el tratamiento de datos para la gestión de la jornada. Los datos se guardarán de forma segura.
                        </p>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="bg-gradient-to-b from-[#0055A4] to-[#003d7a] p-8 lg:p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC700]/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-10 -translate-x-10" />
                  
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8">
                      <span className="w-2 h-2 bg-[#FFC700] rounded-full" />
                      <span className="text-xs uppercase tracking-wide font-medium px-1">Información</span>
                    </div>

                    <h3 className="text-2xl font-bold mb-6 leading-tight">
                      Impulsando el fútbol femenino asturiano
                    </h3>

                    <div className="space-y-6">
                      {[
                        { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", title: "Entrenamientos específicos", desc: "Sesiones técnicas con entrenadoras tituladas RFFPA" },
                        { icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", title: "Convivencia", desc: "Actividades lúdicas y valores deportivos" },
                        { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Material incluido", desc: "Camiseta oficial XANA para todas las participantes" },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[#FFC700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">{item.title}</h4>
                            <p className="text-sm text-blue-100 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 p-5 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <img src="/images/logo-transparente.png" alt="" className="w-8 h-8 object-contain brightness-0 invert" />
                        <span className="font-semibold">RFFPA</span>
                      </div>
                      <p className="text-sm text-blue-50 leading-relaxed">
                        Jornada organizada por la Real Federación de Fútbol del Principado de Asturias dentro del programa Objetivo FuturAST.
                      </p>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-[#FFC700]">{inscritas.length}</div>
                        <div className="text-xs text-blue-200 uppercase tracking-wide">Inscritas</div>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div>
                        <div className="flex -space-x-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#0055A4] flex items-center justify-center text-[10px] font-bold">
                              {['⚽','🥅','🏃'][i]}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-blue-200 mt-1">Únete al equipo</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sponsors */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">Organiza</span>
                <img src="/images/logo-transparente.png" alt="RFFPA" className="h-10 w-auto grayscale" />
              </div>
              <div className="w-px h-8 bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-3">
                <img src="/images/logo-xana.png" alt="XANA" className="h-6 w-auto" />
              </div>
              <div className="w-px h-8 bg-gray-300 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">Patrocina</span>
                <img src="/images/logo-gam.png" alt="GAM" className="h-8 w-auto grayscale" />
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className="border-t border-gray-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Real Federación de Fútbol del Principado de Asturias — Objetivo FuturAST
          </p>
        </div>
      </footer>
    </div>
  );
}