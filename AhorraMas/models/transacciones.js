export class Transacciones {
    constructor(id, tipo, monto, categoria, fecha, descripcion, usuarioId) {
        this.id = id;
        this.tipo = tipo; // 'ingreso' | 'gasto'
        this.monto = monto;
        this.categoria = categoria;
        this.fecha = fecha;
        this.descripcion = descripcion || '';
        this.usuarioId = usuarioId;
    }

      static validarTipo(tipo) {
        const tiposValidos = ['ingreso', 'gasto'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error('El tipo debe ser "ingreso" o "gasto"');
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
        if (monto > 1000000000) { // 1 billón
            throw new Error('El monto no puede ser mayor a 1,000,000,000');
        }
        return true;
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

    static validarFecha(fecha) {
        if (!fecha) {
            throw new Error('La fecha no puede estar vacía');
        }
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
            throw new Error('La fecha no es válida');
        }
        // No permitir fechas futuras
        if (fechaObj > new Date()) {
            throw new Error('No se pueden agregar transacciones con fecha futura');
        }
        return true;
    }

    static validarDescripcion(descripcion) {
        if (descripcion && descripcion.length > 200) {
            throw new Error('La descripción no puede tener más de 200 caracteres');
        }
        return true;
    }

}