export class Presupuesto {
    constructor(id, categoria, monto, mes, usuarioId, fechaCreacion) {
        this.id = id;
        this.categoria = categoria;
        this.monto = monto;
        this.mes = mes; // Formato: YYYY-MM
        this.usuarioId = usuarioId;
        this.fechaCreacion = fechaCreacion || new Date().toISOString();
    }

    static validarCategoria(categoria) {
        if (!categoria || categoria.trim().length === 0) {
            throw new Error('La categoría no puede estar vacía');
        }
        if (categoria.length > 50) {
            throw new Error('La categoría no puede tener más de 50 caracteres');
        }
        return true;
    }

    static validarMonto(monto) {
        if (monto === undefined || monto === null) {
            throw new Error('El monto no puede estar vacío');
        }
        if (typeof monto !== 'number') {
            throw new Error('El monto debe ser un número');
        }
        if (monto <= 0) {
            throw new Error('El monto debe ser mayor a 0');
        }
        if (monto > 1000000000) {
            throw new Error('El monto no puede ser mayor a 1,000,000,000');
        }
        return true;
    }

    static validarMes(mes) {
        if (!mes) {
            throw new Error('El mes no puede estar vacío');
        }
        const mesRegex = /^\d{4}-\d{2}$/;
        if (!mesRegex.test(mes)) {
            throw new Error('El formato del mes debe ser YYYY-MM');
        }
        
        const [ano, mesNum] = mes.split('-').map(Number);
        if (mesNum < 1 || mesNum > 12) {
            throw new Error('El mes debe estar entre 01 y 12');
        }
        
        // No permitir meses futuros
        const ahora = new Date();
        const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
        if (mes > mesActual) {
            throw new Error('No se pueden crear presupuestos para meses futuros');
        }
        
        return true;
    }
}