import express from 'express';
import verify from './verifyToken.js';
import models from "./models.js";
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import config from './config.js';
import pkg from 'sequelize';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import * as fs from 'fs';

const {Op} = pkg;
const app = express();


const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(path.resolve(), "/photos/"));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });
const upload = multer({storage:diskStorage})
app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    return res.send("hello world");
})

app.get('/get/photo',(req,res)=>{
    let body = req.query
    let filePath = path.join(path.resolve(),"/photos/");
    return res.sendFile(filePath+body.path)
})

app.post('/login',async(req,res)=>{
    let body = req.body;
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')

    let user = await models.user.findOne({
        where : {username : body.username,password : passwordHash}
    });
    
   
    if(user){
        let payload = {
            id : user.id,
            role : user.role
        };
        let token = jwt.sign(payload,config.secret_key);
        return res.send({
            "status" : "ok",
            "username": user.username,
            "role" : user.role,
            token
        });
    }
    return res.send({
        "status" : "failed"
    })
})
app.post('/register',async(req,res)=>{
    let body = req.body
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')
    let user = await models.user.create({
        "name" : body.name,
        "username" : body.username,
        "password" : passwordHash,
        "role" : body.role,
    })
    return res.send({
        "status" : "ok"
    })

})
app.post('/create/product',[upload.single("photo"),verify.verify],async(req,res)=>{
    let body = req.body

    try {
        let product = await models.product.create({
            "name" : body.name,
            "SKU" : body.SKU,
            "sellingPrice" : body.sellingPrice,
            "capitalPrice" : body.capitalPrice,
            "stock" : body.stock,
            "path" : req.file.filename,
            "unit" : body.unit
        })
        return res.send({
            "status" : "ok"
        })
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }    
})
app.post('/search/product',verify.verify,async(req,res)=>{
    let body = req.body
    let products = await models.product.findAll({
        where : {
            "name" : {
                [Op.like] : `%${body.product_name}%` 
            }
        }
    })
    return res.send({
        status : "ok",
        data : products
    })
})
app.post('/get/product',verify.verify,async(req,res)=>{
    let body = req.body
    let products = await models.product.findAll();
    return res.send({
        status : "ok",
        data : products
    })
})
app.post('/retrieve/product',verify.verify,async(req,res)=>{
    let body = req.body

    let product = await models.product.findOne({
        where : {SKU: body.SKU }
    })
    return res.send({
        "status" : "ok",
        "data" : product
    })
})

app.post('/update/product',[upload.single("photo"),verify.verify],async(req,res)=>{
    let body = req.body

    let product = await models.product.findByPk(body.id);
    if(body.name){
        product.name = body.name
    }
    if(body.SKU){
        product.SKU = body.SKU
    }
    if(body.sellingPrice){
        product.sellingPrice = body.sellingPrice
    }
    if(body.capitalPrice){
        product.capitalPrice = body.capitalPrice
    }
    if(body.stock){
        product.stock = body.stock
    }
    if(body.unit){
        product.unit = body.unit
    }
    if(req.file){
        let pathfile = path.join(path.resolve(), "/photos/")

        fs.unlink(pathfile + product.path,(err)=>{
            if(err && err.code == 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                console.info(`removed`);
            }
        })
        product.path = req.file.filename
    }
    await product.save()
    return res.send({
        "status" : "ok"
    })
})

app.post('/delete/product',verify.verify,async(req,res)=>{
    let body = req.body
    let pathfile = path.join(path.resolve(), "/photos/")
    let product = await models.product.findByPk(body.id)
    fs.unlink(pathfile + product.path,(err)=>{
        if(err && err.code == 'ENOENT') {
            // file doens't exist
            console.info("File doesn't exist, won't remove it.");
        } else if (err) {
            // other errors, e.g. maybe we don't have enough permission
            console.error("Error occurred while trying to remove file");
        } else {
            console.info(`removed`);
        }
    })
    await models.product.destroy({
        where : {
            id : body.id
        }
    })
    return res.send({
        "status" : "ok"
    })
})

app.post('/order/product',verify.verify,async(req,res)=>{
    let body = req.body

    let transaction = await models.transaction.create()
    let totalPrice = 0
    for (let i = 0; i < body.products.length; i++) {
        const product = body.products[i];
        let productDetail = await models.product.findByPk(product.id)
        let totalPriceQty = product.qty * product.sellingPrice
        console.log(totalPriceQty)
        productDetail.stock = productDetail.stock - product.qty
        let transactionDetail = await models.transactionDetail.create({
            ProductId : product.id,
            qty : product.qty,
            totalPriceQty : totalPriceQty,
            TransactionId : transaction.id,
            sellingPrice : product.sellingPrice,
        })
        // await transactionDetail.save()
        await productDetail.save()
        totalPrice += totalPriceQty
    }
    transaction.totalPrice = totalPrice
    await transaction.save()

    return res.send({
        "status" : "ok"
    })
})
app.post('/get/transaction/detail',verify.verify,async(req,res)=>{
    let body = req.body
    try {
        let transaction = await models.transaction.findAll({
            include : [
                {
                    model : models.transactionDetail,
                    include: models.product
                }
            ]
        })
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }
    return res.send({
        "status" : "ok",
        "data" : transaction
    })
})

app.post('/transaction/detail',verify.verify,async(req,res)=>{
    let body = req.body
    try {
        let transaction = await models.transaction.findByPk(body.transaction_id, 
            { 
                include: {all : true},
    
            })
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }
    return res.send({
        "status" : "ok",
        "data" : transaction
    })
})

app.post('/transaction/return',verify.verify, async(req,res)=>{
    let body = req.body
    for(let i = 0; i < body.transactionDetail.length; ++i){
        let td = body.transactionDetail[i]
        
        let tdd = await models.transactionDetail.findByPk(td)
        let product = await models.product.findByPk(tdd.ProductId)
        let tr = await models.transaction.findByPk(tdd.TransactionId)
        product.stock += tdd.qty
        tr.totalPrice -= tdd.totalPriceQty

        product.save()
        tr.save()
        tdd.destroy()
    }
    return res.send({
        "status" : "ok"
    })
})

app.listen(3000);
