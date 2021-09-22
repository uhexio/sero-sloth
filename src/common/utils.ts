import BigNumber from 'bignumber.js'

export default {

    ellipsis:(str: string): string => {
        const splet:number = 10;
        if (str && str.length > splet) {
            str = str.substr(0, splet) + '...' + str.substr(str.length - splet);
        }
        return str;
    },

    toHex(value: string | BigNumber | number):string{
        return "0x"+new BigNumber(value).toString(16)
    },

    toValue(value: string | BigNumber | number, decimal: number): BigNumber {
        return new BigNumber(value).multipliedBy(new BigNumber(10).pow(decimal));
    },

    fromValue(value: string | BigNumber | number, decimal: number): BigNumber {
        if(!value){
            value = 0;
        }
        return new BigNumber(value).dividedBy(new BigNumber(10).pow(decimal));
    },

    hexToString(v:string|number|BigNumber){
        if(!v){
            return "0";
        }
        return new BigNumber(v).toString(10)
    },
}

