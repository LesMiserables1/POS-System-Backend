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

const {Op,Sequelize} = pkg;
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
    try {
     
        let filePath = path.join(path.resolve(),"/photos/");
        return res.sendFile(filePath+body.path)   
    } catch (error) {
        return res.send({
            "status" : "failed",
            "message" : "file does not exist"
        })
    }
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
    try {
        let user = await models.user.create({
            "name" : body.name,
            "username" : body.username,
            "password" : passwordHash,
            "role" : body.role,
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
    try {
     
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
    } catch (error) {
        return res.send({
            status : "failed"
        })
    }
})
app.post('/get/product',verify.verify,async(req,res)=>{
    let body = req.body
    try {
        let products = await models.product.findAll();
        return res.send({
            status : "ok",
            data : products
        })        
    } catch (error) {
        return res.send({
            status : "failed"
        })
    }

})
app.post('/retrieve/product',verify.verify,async(req,res)=>{
    let body = req.body
    
    try {
        let product = await models.product.findOne({
            where : {SKU: body.SKU }
        })
        return res.send({
            "status" : "ok",
            "data" : product
        })        
    } catch (error) {
        return res.send({
            status : "failed"
        })
    }
})

app.post('/update/product',[upload.single("photo"),verify.verify],async(req,res)=>{
    let body = req.body
    try {
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
            
    } catch (error) {
        return res.send({
            "status" : "failed"
        })        
    }
})

app.post('/delete/product',verify.verify,async(req,res)=>{
    let body = req.body
    let pathfile = path.join(path.resolve(), "/photos/")
    try {
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
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }
})

app.post('/order/product',verify.verify,async(req,res)=>{
    let body = req.body
    try {
        let transaction = await models.transaction.create()
        let totalPrice = 0
        for (let i = 0; i < body.products.length; i++) {
            const product = body.products[i];
            let productDetail = await models.product.findByPk(product.id)
            let totalPriceQty = product.quantity * product.sellingPrice
            console.log(totalPriceQty)
            productDetail.stock = productDetail.stock - product.quantity
            let transactionDetail = await models.transactionDetail.create({
                ProductId : product.id,
                qty : product.quantity,
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
    } catch (error) {
        return res.send({
            status : "failed"
        })
    }
    
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
        return res.send({
            "status" : "ok",
            "data" : transaction
        })
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }

})

app.post('/transaction/detail',verify.verify,async(req,res)=>{
    let body = req.body
    try {
        let transaction = await models.transaction.findByPk(body.transaction_id, 
            { 
                include: {all : true},
    
            })
        return res.send({
            "status" : "ok",
            "data" : transaction
        })
    } catch (error) {
        return res.send({
            "status" : "failed"
        })
    }

})

/**
 * transactionDetail : [
 * {
 *      "id" : 1,
 *      "qtyReturn" : 10
 * }
 * ]
 * 
 */
app.post('/transaction/return',verify.verify, async(req,res)=>{
    let body = req.body
    
    for(let i = 0; i < body.transactionDetail.length; ++i){
        let td = body.transactionDetail[i]
        
        let tdd = await models.transactionDetail.findByPk(td.id)
        let product = await models.product.findByPk(tdd.ProductId)
        let tr = await models.transaction.findByPk(tdd.TransactionId)
        product.stock += td.qtyReturn
        let totalPriceReturn = tdd.sellingPrice * td.qtyReturn
        tdd.totalPriceQty -= totalPriceReturn
        tr.totalPrice -= totalPriceReturn
        tdd.qty -= td.qtyReturn

        await product.save()
        await tr.save()
        if(tdd.totalPriceQty == 0)
            await tdd.destroy()
        else await tdd.save()
    }
    // await models.transaction.destroy({
    //     where : {
    //         attribute : ['Transaction.id',[Sequelize.fn('COUNT'),Sequelize.col('TransactionDetail.id'),'transactionCount']],
    //         transactionCount : {
    //             [Op.eq] : 0
    //         }
    //     }
    // })
    await models.transaction.destroy({
        where : {
            totalPrice : {
                [Op.eq] : 0
            }
        }
    })

    return res.send({
        "status" : "ok"
    })
})

app.post("/analytic",verify.verify,async(req,res)=>{

    let body = req.body
    try {
        let transaction = await models.transaction.findAll({
            where:{
                createdAt : {
                    [Op.gte] : body.from_date,
                    [Op.lte] : body.to_date
                }
            },include: models.transactionDetail
        })
        let data = []
        
        for(let i = 0; i < transaction.length; ++i){
            let tdd = transaction[i].TransactionDetails
            let jumlahHargaModal = 0
            for(let j = 0; j < tdd.length; ++j){
                let product = await models.product.findByPk(tdd[j].ProductId)
                jumlahHargaModal += tdd[j].qty*product.capitalPrice
            }
            data.push({
                "date" : transaction[i].createdAt,
                "penjualan" : transaction[i].totalPrice,
                "modal" : jumlahHargaModal
            })    
        }
        return res.send({
            status : "ok",
            data
        })
    } catch (error) {
        return res.send({
            status : "failed"
        })
    }
    
0})
app.listen(3000);

/**
 * print receipt
 * startup service (backend,frontend,database)
 * 
 */
/**
 * @patch 2
 * refactor architecture backend, modular
 * distributed application (using cloud)
 * create testing for API
 * fix bugs and log error
 * 
 */
