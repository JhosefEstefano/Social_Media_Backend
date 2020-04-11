'use strict'

// var path = require('path');
// var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res) {
    var params = req.body;
    
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) =>{
        if(err) return res.status(500).send({message: 'error al guardar el seguimiento'});

        if(!followStored) return res.status(404).send({message: 'El seguimiento no se ha guardado'});

        return res.status(200).send({follow: followStored});
    });
};

function deleteFollow(req, res) {
    var user_id = req.user.sub;
    var follow_id = req.params.id;

    Follow.find({'user': user_id, 'followed': follow_id}).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al dejar de seguir' });

        return res.status(200).send({ message: 'Se ha dejado de seguir este usuario' });
    });
};

function getFollowingUsers(req, res) {
    var user_id = req.user.sub;
    if (req.params.id && req.params,page) {
        user_id = req.params.id;
    }

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }
    
    var items_per_page = 4;

    Follow.find({user: user_id}).populate({path: 'followed'}).paginate(page, items_per_page, (err, follows, total) =>{
        if (err) return res.status(500).send({ message: 'Error al listar seguir' });

        if(!follows) return res.status(404).send({ message: 'No has seguido a ningun usuario' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/items_per_page),
            follows
        });
    });
};

function getFollowedUsers(req, res) {
    var user_id = req.user.sub;
    if (req.params.id && req.params,page) {
        user_id = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }
    
    var items_per_page = 4;

    Follow.find({followed: user_id}).populate('user').paginate(page, items_per_page, (err, follows, total) =>{
        if (err) return res.status(500).send({ message: 'Error al listar seguir' });

        if(!follows) return res.status(404).send({ message: 'No te sigue ningun usuario' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/items_per_page),
            follows
        });
    });
};

//devolver listado de usuarios
function getMyFollows(req, res) {
    var user_id = req.user.sub;
    var find = Follow.find({user: user_id});

    if(req.params.followed){
        find = Follow.find({followed: user_id});
    }

    find.populate('user followed').exec((err, follows) =>{
        if (err) return res.status(500).send({ message: 'Error al listar seguir' });

        if(!follows) return res.status(404).send({ message: 'No te sigue ningun usuario' });

        return res.status(200).send({follows});
    });
};

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}