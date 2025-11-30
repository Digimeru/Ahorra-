import { Platform } from "react-native";
import { openDatabaseAsync } from 'expo-sqlite';

class DatabaseService {
   constructor(){
        this.db = null;
        this.storageKey = 'usuarios';
        this.storageKeyTransacciones = 'transacciones';
        this.storageKeyPresupuestos = 'presupuestos';
    this._initializing = false;
    }

    async initialize(){
        if (this._initializing) return;
        this._initializing = true;

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
                    nombre TEXT NOT NULL,
                    email TEXT UNIQUE,
                    password TEXT,
                    settings TEXT,
                    fecha_registro DATETIME
                );
            `);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS transacciones (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'gasto')),
                    monto REAL NOT NULL,
                    categoria TEXT NOT NULL,
                    descripcion TEXT,
                    fecha DATETIME NOT NULL,
                    usuario_id INTEGER NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                );
            `);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS presupuestos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    categoria TEXT NOT NULL,
                    monto REAL NOT NULL,
                    mes TEXT NOT NULL,
                    usuario_id INTEGER NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                );
            `);

            try {
                await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transacciones_usuario_fecha ON transacciones(usuario_id, fecha);`);
                await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);`);
                await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_presupuestos_usuario_mes ON presupuestos(usuario_id, mes);`);
                // Ensure settings column exists for older DBs
                try {
                    await this.db.execAsync(`ALTER TABLE usuarios ADD COLUMN settings TEXT;`);
                } catch (e) {
                    // ignore if column already exists
                }
            } catch (e) {
                console.warn('No se pudieron crear índices:', e.message || e);
            }
        }
        this._initializing = false;
    }

    async ensureDb(){
        if (Platform.OS === 'web') return;
        if (this.db) return;
        // If another initialization is in progress, wait a bit until it's done
        if (this._initializing) {
            // poll until initialized or timeout
            const start = Date.now();
            while (this._initializing && !this.db) {
                await new Promise(r => setTimeout(r, 50));
                if (Date.now() - start > 10000) {
                    throw new Error('Timeout esperando inicialización de la base de datos');
                }
            }
            if (this.db) return;
        }
        // otherwise try to initialize
        await this.initialize();
        if (!this.db) throw new Error('Base de datos no disponible después de initialize()');
    }

    async getAll(){
        if (Platform.OS === 'web'){
            const data = localStorage.getItem(this.storageKey);
            const parsed = data ? JSON.parse(data) : [];
            // ensure settings is parsed
            return parsed.map(u => ({
                ...u,
                settings: u.settings ? JSON.parse(u.settings) : {}
            }));
        } else {
            await this.ensureDb();
            const rows = await this.db.getAllAsync('SELECT * FROM usuarios ORDER BY id DESC');
            return rows.map(r => ({
                ...r,
                settings: r.settings ? JSON.parse(r.settings) : {}
            }));
        }
    }

    async getById(id) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            return usuarios.find(u => u.id === id) || null;
        } else {
            await this.ensureDb();
            const result = await this.db.getFirstAsync('SELECT * FROM usuarios WHERE id = ?', [id]);
            if (!result) return null;
            return {
                ...result,
                settings: result.settings ? JSON.parse(result.settings) : {}
            };
        }
    }

     async getByEmail(email) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            return usuarios.find(u => u.email === email) || null;
        } else {
            await this.ensureDb();
            const result = await this.db.getFirstAsync('SELECT * FROM usuarios WHERE email = ?', [email]);
            if (!result) return null;
            return {
                ...result,
                settings: result.settings ? JSON.parse(result.settings) : {}
            };
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
                settings: {},
                fecha_registro: new Date().toISOString()
            };

            usuarios.unshift(nuevoUsuario);
            localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
            return nuevoUsuario;
        } else {
            try {
                await this.ensureDb();
                const result = await this.db.runAsync(
                    'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
                    [nombre.trim(), email.toLowerCase().trim(), password]
                );
                return {
                    id: result.lastInsertRowId,
                    nombre: nombre.trim(),
                    email: email.toLowerCase().trim(),
                    password: password,
                    settings: {},
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
                await this.ensureDb();
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
            await this.ensureDb();
            await this.db.runAsync(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nuevaPassword, id]
            );
            return await this.getById(id);
        }
    }

    // Preferencias de usuario almacenadas en la columna 'settings' (JSON)
    async getUserSettings(id) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const u = usuarios.find(x => x.id === id);
            return u ? (u.settings || {}) : {};
        } else {
            await this.ensureDb();
            const row = await this.getById(id);
            return row ? (row.settings || {}) : {};
        }
    }

    async updateUserSettings(id, settingsObj) {
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx === -1) throw new Error('Usuario no encontrado');
            usuarios[idx].settings = { ...(usuarios[idx].settings || {}), ...settingsObj };
            // store as JSON string to maintain compatibility
            const raw = usuarios.map(u => ({ ...u, settings: JSON.stringify(u.settings) }));
            localStorage.setItem(this.storageKey, JSON.stringify(raw));
            return usuarios[idx].settings;
        } else {
            await this.ensureDb();
            const current = await this.getById(id);
            if (!current) throw new Error('Usuario no encontrado');
            const merged = { ...(current.settings || {}), ...settingsObj };
            await this.db.runAsync('UPDATE usuarios SET settings = ? WHERE id = ?', [JSON.stringify(merged), id]);
            return merged;
        }
    }

    async delete(id){
        if (Platform.OS === 'web'){
            const usuarios = await this.getAll();
            const usuariosFiltrados = usuarios.filter(u => u.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(usuariosFiltrados));
        } else {
            await this.ensureDb();
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

 async agregarTransaccion(tipo, monto, categoria, descripcion, fecha, usuarioId) {
        if (Platform.OS === 'web'){
            const transacciones = await this.obtenerTransacciones();
            const nuevaTransaccion = {
                id: Date.now(),
                tipo,
                monto,
                categoria,
                descripcion: descripcion || '',
                fecha,
                usuario_id: usuarioId
            };

            transacciones.unshift(nuevaTransaccion);
            localStorage.setItem(this.storageKeyTransacciones, JSON.stringify(transacciones));
            return nuevaTransaccion;
        } else {
            await this.ensureDb();
            const result = await this.db.runAsync(
                'INSERT INTO transacciones (tipo, monto, categoria, descripcion, fecha, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
                [tipo, monto, categoria, descripcion || '', fecha, usuarioId]
            );
            return {
                id: result.lastInsertRowId,
                tipo,
                monto,
                categoria,
                descripcion: descripcion || '',
                fecha,
                usuario_id: usuarioId
            };
        }
    }

    async obtenerTransacciones(usuarioId, limite = null) {
        if (Platform.OS === 'web'){
            const data = localStorage.getItem(this.storageKeyTransacciones);
            const transacciones = data ? JSON.parse(data) : [];
            const filtradas = transacciones.filter(t => t.usuario_id === usuarioId);
            return limite ? filtradas.slice(0, limite) : filtradas;
        } else {
            let query = 'SELECT * FROM transacciones WHERE usuario_id = ? ORDER BY fecha DESC';
            if (limite) {
                query += ` LIMIT ${limite}`;
            }
            await this.ensureDb();
            return await this.db.getAllAsync(query, usuarioId);
        }
    }

    async obtenerTransaccionesPorMes(usuarioId, mes) {
        if (Platform.OS === 'web'){
            const transacciones = await this.obtenerTransacciones(usuarioId);
            return transacciones.filter(t => t.fecha.startsWith(mes));
        } else {
            await this.ensureDb();
            return await this.db.getAllAsync(
                'SELECT * FROM transacciones WHERE usuario_id = ? AND strftime("%Y-%m", fecha) = ? ORDER BY fecha DESC',
                [usuarioId, mes]
            );
        }
    }

    async obtenerResumenMensual(usuarioId, mes) {
        const transacciones = await this.obtenerTransaccionesPorMes(usuarioId, mes);
        
        const ingresos = transacciones
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + t.monto, 0);

        const gastos = transacciones
            .filter(t => t.tipo === 'gasto')
            .reduce((sum, t) => sum + t.monto, 0);

        const gastosPorCategoria = {};
        transacciones
            .filter(t => t.tipo === 'gasto')
            .forEach(t => {
                if (!gastosPorCategoria[t.categoria]) {
                    gastosPorCategoria[t.categoria] = 0;
                }
                gastosPorCategoria[t.categoria] += t.monto;
            });

        const ingresosPorCategoria = {};
        transacciones
            .filter(t => t.tipo === 'ingreso')
            .forEach(t => {
                if (!ingresosPorCategoria[t.categoria]) {
                    ingresosPorCategoria[t.categoria] = 0;
                }
                ingresosPorCategoria[t.categoria] += t.monto;
            });

        return {
            ingresos,
            gastos,
            balance: ingresos - gastos,
            gastosPorCategoria,
            ingresosPorCategoria,
            totalTransacciones: transacciones.length
        };
    }

    async eliminarTransaccion(id, usuarioId) {
        if (Platform.OS === 'web'){
            const transacciones = await this.obtenerTransacciones();
            const filtradas = transacciones.filter(t => !(t.id === id && t.usuario_id === usuarioId));
            localStorage.setItem(this.storageKeyTransacciones, JSON.stringify(filtradas));
        } else {
            await this.ensureDb();
            await this.db.runAsync(
                'DELETE FROM transacciones WHERE id = ? AND usuario_id = ?',
                [id, usuarioId]
            );
        }
    }

    // ========== MÉTODOS PARA PRESUPUESTOS ==========
    async agregarPresupuesto(categoria, monto, mes, usuarioId) {
        if (Platform.OS === 'web'){
            const presupuestos = await this.obtenerPresupuestos();
            const nuevoPresupuesto = {
                id: Date.now(),
                categoria,
                monto,
                mes,
                usuario_id: usuarioId
            };

            presupuestos.unshift(nuevoPresupuesto);
            localStorage.setItem(this.storageKeyPresupuestos, JSON.stringify(presupuestos));
            return nuevoPresupuesto;
        } else {
            await this.ensureDb();
            const result = await this.db.runAsync(
                'INSERT INTO presupuestos (categoria, monto, mes, usuario_id) VALUES (?, ?, ?, ?)',
                [categoria, monto, mes, usuarioId]
            );
            return {
                id: result.lastInsertRowId,
                categoria,
                monto,
                mes,
                usuario_id: usuarioId
            };
        }
    }

    async updatePresupuesto(id, categoria, monto, mes, usuarioId) {
        if (Platform.OS === 'web'){
            const presupuestos = await this.obtenerPresupuestos();
            const idx = presupuestos.findIndex(p => p.id === id && p.usuario_id === usuarioId);
            if (idx === -1) throw new Error('Presupuesto no encontrado');
            presupuestos[idx].categoria = categoria;
            presupuestos[idx].monto = monto;
            presupuestos[idx].mes = mes;
            localStorage.setItem(this.storageKeyPresupuestos, JSON.stringify(presupuestos));
            return presupuestos[idx];
        } else {
            await this.ensureDb();
            await this.db.runAsync(
                'UPDATE presupuestos SET categoria = ?, monto = ?, mes = ? WHERE id = ? AND usuario_id = ?',
                [categoria, monto, mes, id, usuarioId]
            );
            const rows = await this.db.getAllAsync('SELECT * FROM presupuestos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
            return rows[0] || null;
        }
    }

    async deletePresupuesto(id, usuarioId) {
        if (Platform.OS === 'web'){
            const presupuestos = await this.obtenerPresupuestos();
            const filtrados = presupuestos.filter(p => !(p.id === id && p.usuario_id === usuarioId));
            localStorage.setItem(this.storageKeyPresupuestos, JSON.stringify(filtrados));
            return;
        } else {
            await this.ensureDb();
            await this.db.runAsync('DELETE FROM presupuestos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
            return;
        }
    }

    async obtenerPresupuestos(usuarioId, mes = null) {
        if (Platform.OS === 'web'){
            const data = localStorage.getItem(this.storageKeyPresupuestos);
            const presupuestos = data ? JSON.parse(data) : [];
            let filtrados = presupuestos.filter(p => p.usuario_id === usuarioId);
            if (mes) {
                filtrados = filtrados.filter(p => p.mes === mes);
            }
            return filtrados;
        } else {
            let query = 'SELECT * FROM presupuestos WHERE usuario_id = ?';
            const params = [usuarioId];
            
            if (mes) {
                query += ' AND mes = ?';
                params.push(mes);
            }
            
            query += ' ORDER BY mes DESC';
            await this.ensureDb();
            return await this.db.getAllAsync(query, params);
        }
    }
}

export default new DatabaseService();