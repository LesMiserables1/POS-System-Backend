import express from 'express';
import verify from './verifyToken.js';
import models from "./models.js";
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import config from './config.js';
import pkg from 'sequelize';
import multer from 'multer';
import path from 'path';
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

app.get('/',(req,res)=>{
    return res.send("hello world");
})

app.get('/get/photo',(req,res)=>{
    let body = req.body
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
            token
        });
    }
    return res.send({
        "status" : "failed"
    })
})
app.post('/register', verify.verify,async(req,res)=>{
    if(req.decode.role != 'admin'){
        return res.send({
            "status" : "failed",
        })
    }
    let body = req.body
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')
    let user = await models.user.create({
        "name" : body.name,
        "username" : body.username,
        "password" : passwordHash,
        "role" : "employee",
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
            "price" : body.price,
            "stock" : body.stock,
            "path" : req.file.filename
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

app.post('/update/product',verify.verify,async(req,res)=>{
    let body = req.body

    let product = await models.product.findByPk(body.product_id);
    if(body.name){
        product.name = body.name
    }
    if(body.SKU){
        product.SKU = body.SKU
    }
    if(body.price){
        product.price = body.price
    }
    if(body.stock){
        product.stock = body.stock
    }
    await product.save()
    return res.send({
        "status" : "ok"
    })
})

app.post('/delete/product',verify.verify,async(req,res)=>{
    let body = req.body
    await models.product.destroy({
        where : {
            id : body.product_id
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
        let productDetail = await models.product.findByPk(product.product_id)
        let totalPriceQty = product.qty * productDetail.price
        productDetail.stock -= body.qty
        let transactionDetail = await models.transactionDetail.create({
            ProductId : product.product_id,
            qty : body.qty,
            totalPriceQty : totalPriceQty,
            TransactionId : transaction.id
        })
        await transactionDetail.save()
        await productDetail.save()
        totalPrice += totalPriceQty
    }
    transaction.totalPrice = totalPrice
    await transaction.save()

    return res.send({
        "status" : "ok"
    })
})
app.post('/transaction/detail',verify.verify,async(req,res)=>{
    let body = req.body
    let transaction = await models.transaction.findByPk(body.transaction_id, { include: models.transactionDetail })

    return res.send({
        "status" : "ok",
        "data" : transaction
    })
})
app.listen(3000);