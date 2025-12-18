import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  // ← 추가!

// Account 필드
const FIELDS = [
    'Account.Telephone_Opt_In__c',
    'Account.SMS_Opt_In__c',
    'Account.Email_Opt_In__c'
];

export default class CommunicationChannels extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    account;

    get isTelephoneOptIn() {
        if (!this.account || !this.account.data) return false;
        const value = this.account.data.fields.Telephone_Opt_In__c?.value;
        console.log('Telephone value:', value);
        return value === true;
    }

    get telephoneIndicatorClass() {
        return this.isTelephoneOptIn ? 'indicator green' : 'indicator red';
    }

    get isSMSOptIn() {
        if (!this.account || !this.account.data) return false;
        const value = this.account.data.fields.SMS_Opt_In__c?.value;
        console.log('SMS value:', value);
        return value === true;
    }

    get smsIndicatorClass() {
        return this.isSMSOptIn ? 'indicator green' : 'indicator red';
    }

    get isEmailOptIn() {
        if (!this.account || !this.account.data) return false;
        const value = this.account.data.fields.Email_Opt_In__c?.value;
        console.log('Email value:', value);
        return value === true;
    }

    get emailIndicatorClass() {
        return this.isEmailOptIn ? 'indicator green' : 'indicator red';
    }

// Telephone 클릭
    handleTelephoneClick() {
        if (!this.isTelephoneOptIn) {
            this.showToast('수신거부', '고객이 전화 수신을 거부했습니다.', 'warning');
            return;
        }
        this.showToast('전화 연결', '전화를 연결합니다.', 'success');
    }

    // SMS 클릭
    handleSMSClick() {
        if (!this.isSMSOptIn) {
            this.showToast('수신거부', '고객이 SMS 수신을 거부했습니다.', 'warning');
            return;
        }
        this.showToast('SMS 전송', 'SMS를 전송합니다.', 'success');
    }

    // Email 클릭
    handleEmailClick() {
        if (!this.isEmailOptIn) {
            this.showToast('수신거부', '고객이 Email 수신을 거부했습니다.', 'warning');
            return;
        }
        this.showToast('Email 작성', 'Email을 작성합니다.', 'success');
    }

    // Toast 메시지 표시
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}