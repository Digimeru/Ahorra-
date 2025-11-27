export class Transaccion {
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

export class Categorias {
    static categoriasIngresos = [
        'Salario',
        'Freelance',
        'Inversiones',
        'Otros Ingresos'
    ];

    static categoriasGastos = [
        'Alimentación',
        'Transporte',
        'Vivienda',
        'Ocio',
        'Servicios',
        'Salud',
        'Educación',
        'Seguridad',
        'Otros Gastos'
    ];

    static obtenerTodas() {
        return [...this.categoriasIngresos, ...this.categoriasGastos];
    }

    static validarCategoria(categoria) {
        const todasCategorias = this.obtenerTodas();
        if (!todasCategorias.includes(categoria)) {
            throw new Error(`La categoría "${categoria}" no es válida. Categorías permitidas: ${todasCategorias.join(', ')}`);
        }
        return true;
    }

    static obtenerPorTipo(tipo) {
        if (tipo === 'ingreso') {
            return this.categoriasIngresos;
        } else if (tipo === 'gasto') {
            return this.categoriasGastos;
        } else {
            throw new Error('Tipo debe ser "ingreso" o "gasto"');
        }
    }

    // Colores para las categorías (para gráficas)
    static coloresCategorias = {
        'Salario': '#10b981',
        'Freelance': '#059669',
        'Inversiones': '#0ea5e9',
        'Otros Ingresos': '#3b82f6',
        'Alimentación': '#ec4899',
        'Transporte': '#ef4444',
        'Vivienda': '#f97316',
        'Ocio': '#eab308',
        'Servicios': '#8b5cf6',
        'Salud': '#06b6d4',
        'Educación': '#84cc16',
        'Seguridad': '#6366f1',
        'Otros Gastos': '#64748b'
    };

    static obtenerColor(categoria) {
        return this.coloresCategorias[categoria] || '#6b7280';
    }
}