'use strict'
 
var mongoose = require('mongoose');

var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/SocialMedia', { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Se ha conectado a la base de datos");
        app.listen(port, () => {
            console.log("Servidor corriendo en "+ port);
        })
    }).catch(err => console.log(err));