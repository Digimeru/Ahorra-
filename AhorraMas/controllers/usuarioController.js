import DatabaseService from '../database/dataBaseService';
import { Usuario } from '../models/usuario';

export class UsuarioController {
    constructor(){
        this.listeners = [];
        this.currentUser = null;
    }

    async initialize(){
        await DatabaseService.initialize();
    }

    async obtenerUsuarios(){
        try{
            const data = await DatabaseService.getAll();
            return data.map(u => new Usuario(
                u.id, 
                u.nombre, 
                u.email, 
                u.password, 
                u.fecha_registro
            ));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw new Error('No se pudieron cargar los usuarios');
        }
    }

    async obtenerUsuarioPorId(id){
        try{
            const data = await DatabaseService.getById(id);
            if (!data) {
                throw new Error('Usuario no encontrado');
            }
            return new Usuario(
                data.id,
                data.nombre,
                data.email,
                data.password,
                data.fecha_registro
            );
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    }

    async registrarUsuario(nombre, email, password, confirmarPassword){
        try{
            // Validaciones
            Usuario.validarNombre(nombre);
            Usuario.validarEmail(email);
            Usuario.validarPassword(password);

            if (password !== confirmarPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            // Crear usuario en la base de datos
            const nuevoUsuario = await DatabaseService.add(nombre, email, password);

            this.notifyListeners();

            return new Usuario(
                nuevoUsuario.id,
                nuevoUsuario.nombre,
                nuevoUsuario.email,
                nuevoUsuario.password,
                nuevoUsuario.fecha_registro
            );
        } catch (error){
            console.error('Error al registrar usuario:', error);
            throw error;
        }
    }

    async iniciarSesion(email, password){
        try{
            Usuario.validarEmail(email);
            Usuario.validarPassword(password);

            const usuario = await DatabaseService.authenticate(email, password);
            
            if (!usuario) {
                throw new Error('Email o contraseña incorrectos');
            }

            return new Usuario(
                usuario.id,
                usuario.nombre,
                usuario.email,
                usuario.password,
                usuario.fecha_registro
            );
        } catch (error){
            console.error('Error al iniciar sesión:', error);
            throw error;
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.notifyListeners();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Cierra la sesión del usuario actual
    logout() {
        this.currentUser = null;
        this.notifyListeners();
    }

    async editarPerfil(id, nuevoNombre, nuevoEmail){
        try{
            Usuario.validarNombre(nuevoNombre);
            Usuario.validarEmail(nuevoEmail);

            const usuarioActualizado = await DatabaseService.update(id, nuevoNombre, nuevoEmail);

            this.notifyListeners();

            return new Usuario(
                usuarioActualizado.id,
                usuarioActualizado.nombre,
                usuarioActualizado.email,
                usuarioActualizado.password,
            );
        } catch (error){
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }

    async cambiarPassword(id, nuevaPassword, confirmarPassword){
        try{
            Usuario.validarPassword(nuevaPassword);

            if (nuevaPassword !== confirmarPassword) {
                throw new Error('Las contraseñas no es la misma');
            }

            const usuarioActualizado = await DatabaseService.updatePassword(id, nuevaPassword);

            this.notifyListeners();

            return new Usuario(
                usuarioActualizado.id,
                usuarioActualizado.nombre,
                usuarioActualizado.email,
                usuarioActualizado.password,
                usuarioActualizado.fecha_registro
            );
        } catch (error){
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    }

    // Preferencias / settings
    async obtenerPreferencias(id){
        try{
            return await DatabaseService.getUserSettings(id);
        } catch (error){
            console.error('Error al obtener preferencias:', error);
            return {};
        }
    }

    async actualizarPreferencias(id, prefs){
        try{
            const updated = await DatabaseService.updateUserSettings(id, prefs);
            // si el usuario actual es el mismo, actualizar currentUser.settings
            if (this.currentUser && this.currentUser.id === id) {
                this.currentUser = { ...this.currentUser, settings: updated };
                this.notifyListeners();
            }
            return updated;
        } catch (error){
            console.error('Error al actualizar preferencias:', error);
            throw error;
        }
    }

    async eliminarUsuario(id){
        try{
            await DatabaseService.delete(id);
            this.notifyListeners();
        } catch (error){
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }

    addListener(callback){
        this.listeners.push(callback);
    }

    removeListener(callback){
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
}

export default new UsuarioController();