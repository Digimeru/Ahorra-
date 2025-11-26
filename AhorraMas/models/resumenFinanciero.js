export class ResumenFinanciero {
    constructor(transacciones = [], presupuestos = []) {
        this.transacciones = transacciones;
        this.presupuestos = presupuestos;
        this.calcularResumen();
    }

    calcularResumen() {
        const mesActual = new Date().toISOString().slice(0, 7);
        
        // Ingresos y gastos del mes actual
        this.ingresosMensuales = this.transacciones
            .filter(t => t.esIngreso && t.fecha.slice(0, 7) === mesActual)
            .reduce((sum, t) => sum + t.monto, 0);

        this.gastosMensuales = this.transacciones
            .filter(t => t.esGasto && t.fecha.slice(0, 7) === mesActual)
            .reduce((sum, t) => sum + t.monto, 0);

        this.balance = this.ingresosMensuales - this.gastosMensuales;

        // Gastos por categoría
        this.gastosPorCategoria = this.calcularGastosPorCategoria();
        
        // Progreso de presupuestos
        this.progresoPresupuestos = this.calcularProgresoPresupuestos();
    }

    calcularGastosPorCategoria() {
        const mesActual = new Date().toISOString().slice(0, 7);
        const gastos = this.transacciones.filter(t => 
            t.esGasto && t.fecha.slice(0, 7) === mesActual
        );

        const porCategoria = {};
        gastos.forEach(gasto => {
            if (!porCategoria[gasto.categoria]) {
                porCategoria[gasto.categoria] = 0;
            }
            porCategoria[gasto.categoria] += gasto.monto;
        });

        return porCategoria;
    }

    calcularProgresoPresupuestos() {
        const mesActual = new Date().toISOString().slice(0, 7);
        const presupuestosActuales = this.presupuestos.filter(p => p.mes === mesActual);
        const progreso = {};

        presupuestosActuales.forEach(presupuesto => {
            const gastado = this.transacciones
                .filter(t => t.esGasto && t.categoria === presupuesto.categoria && 
                            t.fecha.slice(0, 7) === mesActual)
                .reduce((sum, t) => sum + t.monto, 0);

            progreso[presupuesto.categoria] = {
                presupuesto: presupuesto.monto,
                gastado: gastado,
                restante: presupuesto.monto - gastado,
                porcentaje: (gastado / presupuesto.monto) * 100
            };
        });

        return progreso;
    }

    obtenerAlertasPresupuesto() {
        const alertas = [];
        
        Object.entries(this.progresoPresupuestos).forEach(([categoria, datos]) => {
            if (datos.porcentaje > 100) {
                alertas.push({
                    tipo: 'error',
                    categoria: categoria,
                    mensaje: `¡Presupuesto excedido! Has superado el presupuesto de ${categoria} por ${this.formatearMoneda(Math.abs(datos.restante))}`,
                    porcentaje: datos.porcentaje
                });
            } else if (datos.porcentaje >= 90) {
                alertas.push({
                    tipo: 'advertencia',
                    categoria: categoria,
                    mensaje: `¡Atención! Estás cerca del límite de tu presupuesto de ${categoria}. Te quedan ${this.formatearMoneda(datos.restante)}`,
                    porcentaje: datos.porcentaje
                });
            }
        });

        return alertas;
    }

    formatearMoneda(monto) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MX'
        }).format(monto);
    }
}