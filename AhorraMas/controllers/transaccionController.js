import DatabaseService from '../database/dataBaseService';
import { Transaccion } from '../models/transacciones';
import { Categorias } from '../models/transacciones';

export class TransaccionController {
    constructor() {
        this.listeners = [];
    }

    async initialize() {
        await DatabaseService.initialize();
    }

    async agregarTransaccion(tipo, monto, categoria, descripcion, fecha, usuarioId) {
        try {

            Transaccion.validarTipo(tipo);
            Transaccion.validarMonto(monto);
            Transaccion.validarCategoria(categoria);
            Transaccion.validarFecha(fecha);
            Transaccion.validarDescripcion(descripcion);


            const categoriasValidas = Categorias.obtenerPorTipo(tipo);
            if (!categoriasValidas.includes(categoria)) {
                throw new Error(`La categoría "${categoria}" no es válida para ${tipo}s. Categorías permitidas: ${categoriasValidas.join(', ')}`);
            }

            const nuevaTransaccion = await DatabaseService.agregarTransaccion(
                tipo, 
                monto, 
                categoria, 
                descripcion, 
                fecha, 
                usuarioId
            );

            this.notifyListeners();
            return new Transaccion(
                nuevaTransaccion.id,
                nuevaTransaccion.tipo,
                nuevaTransaccion.monto,
                nuevaTransaccion.categoria,
                nuevaTransaccion.fecha,
                nuevaTransaccion.descripcion,
                nuevaTransaccion.usuario_id
            );
        } catch (error) {
            console.error('Error al agregar transacción:', error);
            throw error;
        }
    }

    async obtenerTransacciones(usuarioId, limite = null) {
        try {
            const data = await DatabaseService.obtenerTransacciones(usuarioId, limite);
            return data.map(t => new Transaccion(
                t.id,
                t.tipo,
                t.monto,
                t.categoria,
                t.fecha,
                t.descripcion,
                t.usuario_id
            ));
        } catch (error) {
            console.error('Error al obtener transacciones:', error);
            throw new Error('No se pudieron cargar las transacciones');
        }
    }

    async obtenerResumenMensual(usuarioId, mes = null) {
        try {
            const mesActual = mes || new Date().toISOString().slice(0, 7);
            
            const resumen = await DatabaseService.obtenerResumenMensual(usuarioId, mesActual);
            
            const ingresosPorCategoria = [];
            const gastosPorCategoria = [];
            
            Object.entries(resumen.ingresosPorCategoria).forEach(([categoria, monto]) => {
                const porcentaje = resumen.ingresos > 0 ? (monto / resumen.ingresos) * 100 : 0;
                ingresosPorCategoria.push({
                    categoria,
                    monto,
                    porcentaje: Math.round(porcentaje)
                });
            });
            
            Object.entries(resumen.gastosPorCategoria).forEach(([categoria, monto]) => {
                const porcentaje = resumen.gastos > 0 ? (monto / resumen.gastos) * 100 : 0;
                gastosPorCategoria.push({
                    categoria,
                    monto,
                    porcentaje: Math.round(porcentaje)
                });
            });
            
            return {
                ...resumen,
                ingresosPorCategoria: ingresosPorCategoria.sort((a, b) => b.monto - a.monto),
                gastosPorCategoria: gastosPorCategoria.sort((a, b) => b.monto - a.monto),
                mes: mesActual
            };
        } catch (error) {
            console.error('Error al obtener resumen mensual:', error);
            throw new Error('No se pudo generar el resumen financiero');
        }
    }

    async eliminarTransaccion(id, usuarioId) {
        try {
            await DatabaseService.eliminarTransaccion(id, usuarioId);
            this.notifyListeners();
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            throw error;
        }
    }

    async obtenerPresupuestos(usuarioId, mes = null) {
        try {
            const data = await DatabaseService.obtenerPresupuestos(usuarioId, mes);
            return data;
        } catch (error) {
            console.error('Error al obtener presupuestos:', error);
            throw new Error('No se pudieron cargar los presupuestos');
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
}

export default new TransaccionController();