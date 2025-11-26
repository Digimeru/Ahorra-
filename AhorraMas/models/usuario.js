export class Usuario {
    constructor(id, nombre, email, password, FechaRegistro) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.FechaRegistro = FechaRegistro || new Date();
    }

     static validarNombre(nombre) {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre no puede estar vacío');
        }
        if (nombre.length > 50) {
            throw new Error('El nombre no puede tener más de 50 caracteres');
        }
        return true;
    }

    static validarEmail(email) {
        if (!email || email.trim().length === 0) {
            throw new Error('El email no puede estar vacío');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('El formato del email no es válido');
        }
        if (email.length > 100) {
            throw new Error('El email no puede tener más de 100 caracteres');
        }
        return true;
    }

    static validarPassword(password) {
        if (!password || password.length === 0) {
            throw new Error('La contraseña no puede estar vacía');
        }
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        if (password.length > 50) {
            throw new Error('La contraseña no puede tener más de 50 caracteres');
        }
        return true;
    }

}