import { Platform } from "react-native";
import { openDatabaseAsync } from 'expo-sqlite';

class DatabaseService {
    constructor(){
        this.db = null;
        this.storageKey = 'usuarios';
    }

    async initialize(){
        if (Platform.OS === 'web'){
            console.log('Usando LocalStorage para web');
        } else {
            console.log('Usando SQLite para movil');
            if (typeof openDatabaseAsync !== 'function') {
                console.error('expo-sqlite: openDatabaseAsync no está disponible');
                throw new Error('expo-sqlite openDatabaseAsync no disponible');
            }

            this.db = await openDatabaseAsync('miapp.db');

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL
                );
            `);

            const pragma = await this.db.getAllAsync(`PRAGMA table_info('usuarios');`);
            const existingCols = pragma.map(c => c.name);

            if (!existingCols.includes('email')) {
                await this.db.execAsync(`ALTER TABLE usuarios ADD COLUMN email TEXT;`);
            }
            if (!existingCols.includes('password')) {
                await this.db.execAsync(`ALTER TABLE usuarios ADD COLUMN password TEXT;`);
            }
            if (!existingCols.includes('fecha_registro')) {
                await this.db.execAsync(`ALTER TABLE usuarios ADD COLUMN fecha_registro DATETIME;`);
            }

            try {
                await this.db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);`);
            } catch (e) {
                console.warn('No se pudo crear índice único en email:', e.message || e);
            }
        }
    }

    async getAll(){
        if (Platform.OS === 'web'){
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } else {
            return await this.db.getAllAsync('SELECT * FROM usuarios ORDER BY id DESC');
        }
    }

    async getById(id) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            return usuarios.find(u => u.id === id) || null;
        } else {
            const result = await this.db.getFirstAsync('SELECT * FROM usuarios WHERE id = ?', id);
            return result || null;
        }
    }

     async getByEmail(email) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            return usuarios.find(u => u.email === email) || null;
        } else {
            const result = await this.db.getFirstAsync('SELECT * FROM usuarios WHERE email = ?', email);
            return result || null;
        }
    }

    async add(nombre, email, password) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();

            // Verificar si el email ya existe
            const emailExiste = usuarios.some(u => u.email === email);
            if (emailExiste) {
                throw new Error('El email ya está registrado');
            }

            const nuevoUsuario = {
                id: Date.now(),
                nombre: nombre.trim(),
                email: email.toLowerCase().trim(),
                password: password,
                fecha_registro: new Date().toISOString()
            };

            usuarios.unshift(nuevoUsuario);
            localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
            return nuevoUsuario;
        } else {
            try {
                const result = await this.db.runAsync(
                    'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
                    [nombre.trim(), email.toLowerCase().trim(), password]
                );
                return {
                    id: result.lastInsertRowId,
                    nombre: nombre.trim(),
                    email: email.toLowerCase().trim(),
                    password: password,
                    fecha_registro: new Date().toISOString()
                };
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error('El email ya está registrado');
                }
                throw error;
            }
        }
    }

    async update(id, nuevoNombre, nuevoEmail) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const usuarioIndex = usuarios.findIndex(u => u.id === id);
            
            if (usuarioIndex !== -1){
                // Verificar si el nuevo email ya existe en otro usuario
                const emailExiste = usuarios.some((u, index) => 
                    u.email === nuevoEmail && index !== usuarioIndex
                );
                if (emailExiste) {
                    throw new Error('El email ya está registrado');
                }

                usuarios[usuarioIndex].nombre = nuevoNombre.trim();
                usuarios[usuarioIndex].email = nuevoEmail.toLowerCase().trim();
                localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
                return usuarios[usuarioIndex];
            }
            throw new Error('Usuario no encontrado');
        } else {
            try {
                await this.db.runAsync(
                    'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
                    [nuevoNombre.trim(), nuevoEmail.toLowerCase().trim(), id]
                );
                return await this.getById(id);
            } catch (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error('El email ya está registrado');
                }
                throw error;
            }
        }
    }

    async updatePassword(id, nuevaPassword) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const usuarioIndex = usuarios.findIndex(u => u.id === id);
            
            if (usuarioIndex !== -1){
                usuarios[usuarioIndex].password = nuevaPassword;
                localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
                return usuarios[usuarioIndex];
            }
            throw new Error('Usuario no encontrado');
        } else {
            await this.db.runAsync(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nuevaPassword, id]
            );
            return await this.getById(id);
        }
    }

    async delete(id){
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const usuariosFiltrados = usuarios.filter(u => u.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(usuariosFiltrados));
        } else {
            await this.db.runAsync(
                'DELETE FROM usuarios WHERE id = ?',
                id
            );
        }
    }

    async authenticate(email, password) {
        const usuario = await this.getByEmail(email);
        if (usuario && usuario.password === password) {
            return usuario;
        }
        return null;
    }


}

export default new DatabaseService();