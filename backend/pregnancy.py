"""
Cálculos del embarazo a partir de la fecha probable de parto (FPP), y el
calendario de controles y estudios que corresponde a cada trimestre.

Los estudios y sus semanas son una propuesta basada en las recomendaciones
de control prenatal del Ministerio de Salud; el equipo tiene que validarlos.
Para cambiarlos alcanza con editar las listas de abajo.
"""
from datetime import date

DURACION_DIAS = 280  # 40 semanas desde la fecha de la última menstruación

# semana_desde / semana_hasta: ventana en la que conviene hacerse el estudio.
ESTUDIOS = [
    {
        "key": "laboratorio_1",
        "nombre": "Laboratorio inicial (grupo y factor, hemograma, glucemia, orina)",
        "semana_desde": 1,
        "semana_hasta": 13,
    },
    {
        "key": "serologias_1",
        "nombre": "Serologías (VDRL, HIV, hepatitis B, Chagas, toxoplasmosis)",
        "semana_desde": 1,
        "semana_hasta": 13,
    },
    {
        "key": "eco_1",
        "nombre": "Ecografía del 1.er trimestre",
        "semana_desde": 11,
        "semana_hasta": 14,
    },
    {
        "key": "eco_morfologica",
        "nombre": "Ecografía morfológica",
        "semana_desde": 20,
        "semana_hasta": 24,
    },
    {
        "key": "ptog",
        "nombre": "Curva de glucemia (PTOG)",
        "semana_desde": 24,
        "semana_hasta": 28,
    },
    {
        "key": "laboratorio_2",
        "nombre": "Hemograma y serologías de control",
        "semana_desde": 24,
        "semana_hasta": 28,
    },
    {
        "key": "eco_3",
        "nombre": "Ecografía del 3.er trimestre",
        "semana_desde": 32,
        "semana_hasta": 36,
    },
    {
        "key": "laboratorio_3",
        "nombre": "Hemograma y serologías del 3.er trimestre",
        "semana_desde": 32,
        "semana_hasta": 36,
    },
    {
        "key": "estreptococo_b",
        "nombre": "Hisopado de estreptococo B",
        "semana_desde": 35,
        "semana_hasta": 37,
    },
    {
        "key": "monitoreo_fetal",
        "nombre": "Monitoreo fetal",
        "semana_desde": 37,
        "semana_hasta": 40,
    },
]

ESTUDIOS_POR_KEY = {e["key"]: e for e in ESTUDIOS}

# Qué tiene que cargar la paciente en la app según el trimestre.
MONITOREO_POR_TRIMESTRE = {
    1: ["Presión arterial: todos los días", "Síntomas: cada vez que te sientas distinta"],
    2: [
        "Presión arterial: todos los días",
        "Peso: una vez por semana",
        "Síntomas: cada vez que te sientas distinta",
    ],
    3: [
        "Presión arterial: todos los días",
        "Peso: dos veces por semana",
        "Síntomas: cada vez que te sientas distinta",
    ],
}


def trimestre_de_semana(semana):
    if semana < 14:
        return 1
    if semana < 28:
        return 2
    return 3


def info_embarazo(fecha_parto, hoy=None):
    """Semana, días y trimestre de hoy. None si no hay fecha de parto."""
    if fecha_parto is None:
        return None
    hoy = hoy or date.today()
    dias_gestacion = max(0, DURACION_DIAS - (fecha_parto - hoy).days)
    semana = dias_gestacion // 7
    return {
        "semana": semana,
        "dias": dias_gestacion % 7,
        "trimestre": trimestre_de_semana(semana),
        "dias_para_el_parto": (fecha_parto - hoy).days,
    }


def estado_estudios(semana, realizados):
    """Cada estudio con su estado para la semana actual.

    realizados: dict {key: fecha_realizado} de los que la paciente ya se hizo.
    Estados: "hecho", "atrasado" (ya pasó la ventana), "pendiente" (está en
    la ventana) o "proximo" (todavía no llegó).
    """
    resultado = []
    for e in ESTUDIOS:
        if e["key"] in realizados:
            estado = "hecho"
        elif semana > e["semana_hasta"]:
            estado = "atrasado"
        elif semana >= e["semana_desde"]:
            estado = "pendiente"
        else:
            estado = "proximo"
        fecha = realizados.get(e["key"])
        resultado.append(
            {
                **e,
                "trimestre": trimestre_de_semana(e["semana_desde"]),
                "estado": estado,
                "fecha_realizado": fecha.isoformat() if fecha else None,
            }
        )
    return resultado
