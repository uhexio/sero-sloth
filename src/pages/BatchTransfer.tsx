import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle,IonSelectOption, IonToolbar,IonList,IonLabel,IonSelect,IonItem,IonTextarea,IonText ,IonButton,IonToast,IonAlert} from '@ionic/react';
import service from "../common/service";
import i18n from "../i18n";
import utils from "../common/utils";
import BigNumber from "bignumber.js";
import './default.css'

interface State {
    text:string
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
}

class BatchTransfer extends React.Component<State, any>{
    
    state:State = {
        text:'',
        accounts:[],
        showToast:false,
        selectAccount:{},
        selectCurrency:'',
        fee:new BigNumber(0),
        value:new BigNumber(0),
        receipts:[],
        showAlert:false
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
                const decimal = await service.getDecimal(k);
                balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
            }
        }else {
            let keys = Object.keys(balances);
            for(let k of keys){
                const v = balances[k];
                const decimal = await service.getDecimal(k);
                balanceMap.set(k,utils.fromValue(v,decimal).toString(10))
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
        const {text,selectAccount,selectCurrency,balance} = this.state;
        if(!text){
            this.toast(i18n.t("tip1"));
        }else if(!selectAccount.PK){
            this.toast(i18n.t("tip2"));
        }else if(!selectCurrency){
            this.toast(i18n.t("tip3"));
        }else if(!balance){
            this.toast(i18n.t("tip4"));
        }else{
            let content:any = text;
            content = content.replace(new RegExp("\n","gm"),";");
            console.log(content);
            const contentArr:Array<any> = content.split(";");
            if(contentArr.length>100){
                this.toast(i18n.t("tip5"));
                return
            }else{
                let value:BigNumber = new BigNumber(0)
                const receipts:any = [];
                const decimal = service.getDecimalCache(selectCurrency)
                for(let contn of contentArr){
                    const tmpArr:Array<any> = contn.split(",");
                    if(tmpArr && tmpArr.length == 2){
                        const address = tmpArr[0];
                        const amount = tmpArr[1];

                        receipts.push({to:address,amount:"0x"+utils.toValue(amount,decimal).toString(16)});
                        value = value.plus(utils.toValue(amount,decimal))
                    }
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

    render(): React.ReactNode {
        const {text,accounts,selectAccount,balanceMap,selectCurrency,balance,showToast,toastMsg,showAlert, receipts,value,fee} = this.state;
        const options = this.renderAccountsOp(accounts);
        const balancesOptions = this.renderBalanceOp(balanceMap);
        const msg:any = this.renderMsg(receipts);
        const decimal = service.getDecimalCache(selectCurrency)
        return (
            <IonPage>
                <IonContent>
                    <IonList>
                        <IonItem>
                            <IonTextarea value={text}
                                         autofocus
                                         clearOnEdit
                                         rows={10}
                                         placeholder={`address,amount\naddress,amount\naddress,amount\naddress,amount`}
                                         onIonChange={e => this.setText(e.detail.value!)}/>
                        </IonItem>
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
                    </IonList>

                    <div style={{width:"100%",position:"fixed",bottom:0}}>
                        <IonButton onClick={this.confirm} expand={"block"}>{i18n.t('send')}</IonButton>
                    </div>

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

export default BatchTransfer;
