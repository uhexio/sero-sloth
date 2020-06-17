import axios from 'axios'
import BigNumber from "bignumber.js";
// @ts-ignore
import seropp from 'sero-pp'
import i18n from "../i18n";
import {storage} from "./storage";

const serojs = require("serojs");

export interface Tx {
    from:string
    mainPKr:string
    value:BigNumber
    poolId?:string
}


const abi=[
    {
        "constant": false,
        "inputs": [
            {
                "components": [
                    {
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "receipts",
                "type": "tuple[]"
            }
        ],
        "name": "airDrop",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "getFee",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
]

const contractAddress = "2gyAVV3HkTCS1ABHprcufEn7CeZZ93kYVsKKSqtWDtvzXDkgLujhgTrXeRKC8MyVu7egH25UsBUsjAFvr6Vy7ahR";

class Service {

    id: number
    contract:any

    constructor() {
        this.id = 0;
        this.contract = serojs.callContract(abi, contractAddress);
    }

    async jsonRpc(method: string, args: any) {
        const data: any = {
            id: this.id++,
            method: method,
            params: args
        }
        const host = localStorage.getItem("rpcHost");
        return new Promise((resolve, reject) => {
            if(!host){
                reject(new Error("rpc host required!"))
            }else{
                axios.post(host, data).then((resp: any) => {
                    if(resp.data && resp.data.error){
                        reject(new Error(resp.data.error.message))
                    }else if(resp.data && resp.data.result){
                        resolve(resp.data.result)
                    }
                }).catch(e => {
                    reject(e)
                })
            }
        })
    }

    async commitTx(tx:Tx){
        await this.initApp()
        return new Promise<any>((resolve, reject) => {
            let executeData = {
                from: tx.from,
                value: "0x" + tx.value.toString(16),
                gasPrice: '0x' + new BigNumber('1000000000').toString(16),
                cy: "SERO",
                gas:'0x' + new BigNumber('25000').toString(16),
                BuyShare: {
                    Vote: tx.mainPKr,
                    Value: '0x' + tx.value.toString(16),
                    Pool: tx.poolId
                }
            }
            seropp.executeContract(executeData, function (rest:any,err:any) {
                if(err){
                    reject(err)
                }else{
                    resolve(rest)
                }
            })
        })
    }

    async getDecimal(currency: string): Promise<any> {
        if (currency == 'SERO') {
            return new Promise(resolve => resolve(18));
        }
        const cache: any = storage.get(storage.keys.decimal(currency));
        if (cache) {
            return new Promise(resolve => resolve(cache));
        } else {
            const data:any = await this.jsonRpc('sero_getDecimal', [currency]);
            const decimal = new BigNumber(data, 16).toNumber();
            storage.set(storage.keys.decimal(currency), decimal);
            return new Promise(resolve => resolve(decimal));
        }
    }

    getDecimalCache(currency: string): any {
        if (currency == 'SERO') {
            return 18;
        }
        const cache: any = storage.get(storage.keys.decimal(currency));
        return cache;
    }

    async initApp(){
        return new Promise(resolve=>{
            const dapp = {
                name: "SLOTH",
                contractAddress: "SLOTH",
                github: "https://github.com/uhexio/sloth",
                author: "uhexio",
                url: "//"+window.location.host,
                logo: "//"+window.location.host+"/assets/icon/icon.png",
            }

            seropp.init(dapp,function (rest:any) {
                seropp.getInfo(function (data:any) {
                    if(data){
                        localStorage.setItem("language",data.language);
                        localStorage.setItem("rpcHost",data.rpc)
                        i18n.changeLanguage(data.language).then(() => {
                            // document.location.href = 'http://' + document.location.host;
                        });
                    }
                    resolve()
                })
            })
        })
    }

    async getAccounts(){
        await this.initApp()
        return new Promise((resolve,reject) => {
            seropp.getAccountList((data:any,err:any)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(data)
                }
            })
        })
    }

    async getAccount(pk:string){
        await this.initApp()

        return new Promise((resolve,reject) => {
            seropp.getAccountDetail(pk,(data:any,err:any)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(data)
                }
            })
        })
    }

    async callMethod(method:string, from:string, args:any) {
        const that = this;
        let packData = this.contract.packData(method, args,true);
        let callParams = {
            from: from,
            to: this.contract.address,
            data: packData
        };
        return new Promise((resolve, reject) => {
            seropp.call(callParams, function (callData:any,err:any) {
                if(err){
                    reject(err)
                }else{
                    if (callData !== "0x") {
                        const res = that.contract.unPackData(method, callData);
                        resolve(res);
                    } else {
                        resolve('');
                    }
                }
            });
        })
    }

    async executeMethod(method:string, pk:string, mainPKr:string, args:any, cy:string, value:BigNumber) {
        let packData = this.contract.packData(method, args,true);
        let executeData:any = {
            from: pk,
            to: this.contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        let estimateParam:any = {
            from: mainPKr,
            to: this.contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };

        return new Promise((resolve, reject) => {
            seropp.estimateGas(estimateParam, function (gas:any, error:any) {
                if (error) {
                } else {
                    executeData["gas"] = gas;
                    seropp.executeContract(executeData, function (res:any, error:any) {
                        if(error){
                            reject(error)
                        }else {
                            resolve(res)
                        }
                    })
                }
            });
        });

    }

}

const service:Service = new Service()
export default service