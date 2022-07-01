import React from 'react';
import { IonContent, IonHeader, IonPage, IonItemDivider,IonInput,IonSelectOption, IonToolbar,IonList,IonLabel,IonSelect,IonItem,IonTextarea,IonText ,IonButton,IonToast,IonAlert} from '@ionic/react';
import service from "../common/service";
import i18n from "../i18n";
import utils from "../common/utils";
import BigNumber from "bignumber.js";
import './default.css'

interface State {
    accounts?:any
    balanceMap?:Map<string,string>
    balance?:string
    selectAccount?:any
    selectCurrency:string
    showToast:boolean
    toastMsg?:string
    fee:BigNumber
    value:BigNumber
    receipts:Array<any>
    showAlert:boolean
    number:any,
    amount:any,
    slice:any
}

class Onekey extends React.Component<State, any>{

    state:State = {
        accounts:[],
        showToast:false,
        selectAccount:{},
        selectCurrency:'',
        fee:new BigNumber(0),
        value:new BigNumber(0),
        receipts:[],
        showAlert:false,
        number:"",
        amount:"",
        slice:0
    }

    setText(value:any){
        this.setState({
            text:value
        })
    }

    toast=(msg:string)=>{
        this.setState({
            showToast:true,
            toastMsg:msg
        })
    }

    hideToast=()=>{
        this.setState({
            showToast:false,
            toastMsg:''
        })
    }

    componentDidMount(): void {

        this.getAccounts().catch()
    }


    async getAccounts(){
        const rest:any = await service.getAccounts();
        this.setState({
            accounts:rest
        })
    }

    async setAccount (pk:any){
        const that = this;
        const rest:any = await service.getAccount(pk);
        const balances:any = rest.Balance;
        let balanceMap:Map<string,string> = new Map()
        if(balances instanceof Map){
            // @ts-ignore
            for(let [k,v] of balances){
                try{
                    const decimal = await service.getDecimal(k);
                    balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
                }catch (e){
                    console.error(e);
                }
            }
        }else {
            let keys = Object.keys(balances);
            for(let k of keys){
                try{
                    const v = balances[k];
                    const decimal = await service.getDecimal(k);
                    balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
                }catch (e){
                    console.error(e)
                }
            }
        }

        that.setState({
            selectAccount:rest,
            balanceMap:balanceMap,
            balance:'',
            selectCurrency:''
        })
    }

    setCurrency = (cy:any)=>{
        const that = this;
        const {balanceMap} = this.state;
        that.setState({
            // @ts-ignore
            balance:balanceMap.get(cy),
            selectCurrency:cy
        })
    }

    getBalance=(balance:any,cy:string)=>{
        if(balance && balance.has(cy)){
            return utils.fromValue(balance.get(cy),18).toFixed(6)
        }
        return "0"
    }

    renderAccountsOp=(accounts:any)=>{
        let ops = [];
        if(accounts && accounts.length>0){
            for(let i=0;i<accounts.length;i++){
                const act = accounts[i];
                ops.push(<IonSelectOption value={act.PK}>{act.Name}({act.MainPKr})</IonSelectOption>)
            }
        }
        return ops
    }

    renderBalanceOp(balanceMap:any){
        let ops:Array<any> = [];
        if(balanceMap && balanceMap.size>0){
            // @ts-ignore
            for(let [k,v] of balanceMap){
                ops.push(<IonSelectOption value={k}>{k}</IonSelectOption>)
            }
        }
        return ops
    }

    confirm = ()=>{
        const that = this;
        const {amount,number,selectAccount,selectCurrency} = this.state;
        if(!amount){
            this.toast("Please Input Amount");
        }else if(!number){
            this.toast("Please Input Number");
        }else{

            const receipts:any = [];
            const decimal = service.getDecimalCache(selectCurrency)
            const value:BigNumber = utils.toValue(amount,decimal);
            for(let i=0;i<parseInt(number);i++){
                const address = selectAccount.MainPKr;
                // const amountTmp = new BigNumber(amount).div(new BigNumber(number));
                receipts.push({to:address,amount:"0x"+value.div(new BigNumber(number)).toString(16)});
                // value = value.plus(utils.toValue(amountTmp,decimal))
            }

            service.callMethod("getFee",selectAccount.MainPKr,["0x"+value.toString(16)]).then((rest:any)=>{
                that.setState({
                    value:value,
                    fee:new BigNumber(rest),
                    receipts:receipts,
                    showAlert:true
                })
            }).catch((e:any)=>{
                const err = typeof e == 'string'?e:e.message;
                that.toast(err)
            })
        }
    }

    submit(){
        const that = this;
        const {fee,value,selectAccount,selectCurrency,receipts} = this.state;
        const valueD = value.plus(fee)
        service.executeMethod("airDrop",selectAccount.PK,selectAccount.MainPKr,[receipts],selectCurrency,valueD).then((rest:any)=>{
            that.toast(rest)
        }).catch((e:any)=>{
            const err = typeof e == 'string'?e:e.message;
            that.toast(err)
        })
    }

    setShowAlert(f:boolean){
        this.setState({
            showAlert:f
        })
    }

    renderMsg=(receipts:Array<any>)=>{
        let h:Array<any> = [];
        const {selectCurrency} = this.state;
        const decimal = service.getDecimalCache(selectCurrency);
        console.log("receipts>>>",receipts);
        if(receipts && receipts.length>0){
            for(let r of receipts){
                h.push({
                    name:"To",
                    type:"text",
                    value:r.to,
                    disabled:true
                })
                h.push({
                    name:"Amount",
                    type:"text",
                    value:utils.fromValue(r.amount,decimal).toString(10),
                    disabled:true
                })
            }
        }
        return h
    }

    setAmountValue(value:any){
        const {number,slice} = this.state;
        this.setState({
            amount:value,
            slice:number?new BigNumber(value).div(new BigNumber(number)).toFixed(6,1):slice
        })
    }

    setNumberValue(value:any){
        const {amount,slice} = this.state;
        if(parseInt(value)>100){
            this.toast("Maximum allowed to send 100 copies")
            return;
        }
        this.setState({
            number:value,
            slice:value?new BigNumber(amount).div(new BigNumber(value)).toFixed(6,1):slice
        })
    }

    render(): React.ReactNode {
        const {accounts,selectAccount,balanceMap,selectCurrency,balance,showToast,toastMsg,showAlert, receipts,value,fee,amount,number,slice} = this.state;
        const options = this.renderAccountsOp(accounts);
        const balancesOptions = this.renderBalanceOp(balanceMap);
        const msg:any = this.renderMsg(receipts);
        const decimal = service.getDecimalCache(selectCurrency)
        return (
            <IonPage>
                <IonContent>
                    <IonList>
                        <IonItemDivider mode="ios">{i18n.t("selectAccount")}</IonItemDivider>
                        <IonItem>
                            <IonLabel>{i18n.t('account')}</IonLabel>
                            <IonSelect value={selectAccount.PK} placeholder={i18n.t('selectOne')} onIonChange={e => this.setAccount(e.detail.value)}>
                                {options}
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>{i18n.t('currency')}</IonLabel>
                            <IonSelect value={selectCurrency} placeholder={i18n.t('selectOne')} onIonChange={e => this.setCurrency(e.detail.value)}>
                                {balancesOptions}
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>{i18n.t('balance')}</IonLabel>
                            <IonText>
                                {balance}
                            </IonText>
                        </IonItem>

                        <IonItemDivider mode="ios">{i18n.t("setData")}</IonItemDivider>
                        <IonItem>
                            <IonInput type="number" inputmode="decimal" value={amount} placeholder={i18n.t("inputAmount")} onIonChange={e => this.setAmountValue(e.detail.value!)} clearInput/>
                        </IonItem>

                        <IonItem>
                            <IonInput type="number" inputmode="numeric" value={number} placeholder={i18n.t("inputNumber")} onIonChange={e => this.setNumberValue(e.detail.value!)} clearInput/>
                        </IonItem>

                        <IonItem>
                            <IonLabel>{i18n.t('slice')}</IonLabel>
                            <IonText>{slice}</IonText>
                        </IonItem>
                    </IonList>

                    <p>
                        <IonButton onClick={this.confirm} expand={"block"} mode="ios" fill={"outline"}>{i18n.t('send')}</IonButton>
                    </p>

                    <IonToast
                        onDidDismiss={this.hideToast}
                        isOpen={showToast}
                        message={toastMsg}
                        duration={2000}
                        color={"warning"}
                    />

                    <IonAlert
                        isOpen={showAlert}
                        onDidDismiss={() => this.setShowAlert(false)}
                        cssClass='my-custom-class'
                        header={'Confirm'}
                        inputs={msg}
                        message={`Total:<strong>${utils.fromValue(value,decimal).toString(10)}</strong><br/>Fee:<strong>${utils.fromValue(fee,decimal).toString(10)}</strong>`}
                        buttons={[
                            {
                                text: 'Cancel',
                                role: 'cancel',
                                cssClass: 'secondary',
                                handler: blah => {}
                            },
                            {
                                text: 'OK',
                                handler: () => {
                                    this.submit()
                                }
                            }
                        ]}
                    />

                </IonContent>
            </IonPage>
        )
    }
}

export default Onekey;
