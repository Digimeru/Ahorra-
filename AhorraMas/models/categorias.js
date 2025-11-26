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
        'Ocio',
        'Servicios',
        'Salud',
        'Educación',
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
}