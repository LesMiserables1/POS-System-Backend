import express from 'express';
import verify from './verifyToken.js';
import models from "./models.js";
import crypto from "crypto";
import verifyToken from './verifyToken.js';
import jwt from 'jsonwebtoken';
import config from './config.js';
import {Op} from "sequelize";
const app = express();

app.use(express.json());

app.get('/',(req,res)=>{
    return res.send("hello world");
})

app.post('/login',async(req,res)=>{
    let body = req.body;
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')

    let user = await models.user.findOne({
        where : {username : body.username,password : passwordHash}
    });
    
    let payload = {
        id : user.id,
        role : user.role
    };
    if(user){
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
app.post('/create/product',verify.verify,async(req,res)=>{
    let body = req.body

    try {
        let product = await models.product.create({
            "name" : body.name,
            "SKU" : body.SKU,
            "price" : body.price,
            "stock" : body.stock
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
    body.products.forEach(async product => {
        let productDetail = await models.product.findByPk(product.product_id)
        let totalPriceQty = body.qty * productDetail.price
        productDetail.stock -= body.qty
        let transactionDetail = await models.transactionDetail.create({
            ProductId : product.product_id,
            qty : body.qty,
            totalPriceQty : totalPriceQty,
            TransactionId : transaction.id
        })
        await transactionDetail.save()
        await totalPriceQty.save()
        totalPrice += totalPriceQty
    });
    transaction.totalPrice = totalPrice
    await transaction.save()

    return res.send({
        "status" : "ok"
    })
})

app.listen(3000);