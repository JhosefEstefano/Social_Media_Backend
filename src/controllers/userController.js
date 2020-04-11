'use strict'

var User = require('../models/user');
var bcryp = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

function saveUser(req, res) {
    var params = req.body;
    var user = new User();

    if (params.name && params.surname && params.nick && params.email && params.password) {
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ message: 'error en la peticion de user' });
            if (users && users.length >= 1) {
                return res.status(200).send({ message: 'El usuario que intenta registrar ya existe' });
            } else {
                bcryp.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;
                    user.save((err, userStored) => {
                        if (err) return res.status(500).send({ message: 'error al guardar user' });

                        if (userStored) {
                            res.status(200).send({ user: userStored });
                        } else {
                            res.status(404).send({ message: 'no se ha registrado el user' })
                        }
                    })
                });
            }
        });

    } else {
        res.status(200).send({
            message: 'Envia todos los campos'
        });
    }
}

function logionUser(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: ' error en la peticion' });

        if (user) {
            bcryp.compare(password, user.password, (err, check) => {
                if (check) {
                    if (params.getToken) {
                        //generar token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });

                    } else {
                        user.password = undefined;
                        return res.status(200).send({ user })
                    }

                } else {
                    return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
                }
            });
        } else {
            return res.status(404).send({ message: 'No existe el user' });
        }
    });

}

function getUser(req, res) {
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });

        if (!user) return res.status(404).send({ message: 'El usuario no existe' });
        user.password = undefined;
        return res.status(200).send({ user });
    });

}

function getUsers(req, res) {
    var identity_user_id = req.user.sub;
    var page = 1;
    if (req.params.page) {
        page = req.params.page;

    }
    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });

        if (!users) return res.status(404).send({ message: 'No hay usuarios disponibles' });

        return res.status(200).send({
            users,
            total,
            page: Math.ceil(total / itemsPerPage)
        });
    });
}

function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tiene permisos para actualizar este usuario' });
    }

    User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
        if (err) return res.status(500).send({ message: 'Error en la peticion' });

        if (!userUpdated) return res.status(404).send({ message: 'No se ha actualizado el usuario' });

        return res.status(200).send({ user: userUpdated });
    });
}

//subir imagenes 
function upImage(req, res) {
    var userId = req.params.id;


    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tiene permisos para actualizar este usuario' });
    }

    if (req.files) {
        var file_path = req.files.image.path;
        var file_spilt = file_path.split('\\');
        var file_name = file_spilt[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (userId != req.user.sub) {
            removeFilesOfUploads(res, file_path, 'No tienes permisos para actualizar los datos de este usuario');
        };

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif') {
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
                if (err) return res.status(500).send({ message: 'Error en la peticion' });

                if (!userUpdated) return res.status(404).send({ message: 'No se ha actualizado el usuario' });
                return res.status(200).send({ user: userUpdated });
            });
        }else{
            removeFilesOfUploads(res, file_path, 'Extension no valida');
        };
    }else{
        return res.status(200).send({ message: 'No se han enviado archivos' });
    };
};

//subir archivos de imagen de user
function getImagenFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;
    
    fs.exists(path_file, (exists) =>{
        if (exists) {
            res.sendFile(path.resolve(path_file));
        }else{
             res.status(200).send({message: 'No existe imagen'});
        };
    });
};


 
function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message })
    });
};

module.exports = {
    saveUser,
    logionUser,
    getUser,
    getUsers,
    updateUser,
    upImage,
    getImagenFile
}