const authService = require('../services/auth.service');

async function register(req, res, next) {
    try {
        const { id_usuario } = await authService.registerUser(req.body);

        return res.status(201).json({
            ok: true,
            message: 'usuario registrado',
            id_usuario
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { user, token } = await authService.loginUser(req.body);
        return res.json({ ok: true, user, token });
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = await authService.getMe(req.user.id_usuario);
        return res.json({ ok: true, user });
    } catch (error) {
        next(error);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const result = await authService.forgotPassword(req.body.email);
        return res.json({ ok: true, ...result });
    } catch (error) {
        next(error);
    }
}

async function resetPassword(req, res, next) {
    try {
        const result = await authService.resetPassword(req.body);
        return res.json({ ok: true, ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, me, forgotPassword, resetPassword };