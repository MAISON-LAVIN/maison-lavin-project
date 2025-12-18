import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import SHIPPING_ADDRESS_FIELD from '@salesforce/schema/Account.Shipping_Full_Address__c';
import CITY_DISTRICT_FIELD from '@salesforce/schema/Account.City_District__c';
import ID_FIELD from '@salesforce/schema/Account.Id';

export default class AddressSearch extends LightningElement {
    
    @api recordId;
    
    postalCode = '';
    address = '';
    detailAddress = '';
    fullAddress = '';
    cityDistrict = '';
    
    @wire(getRecord, {
        recordId: '$recordId',
        fields: [SHIPPING_ADDRESS_FIELD, CITY_DISTRICT_FIELD]
    })
    wiredRecord({ data, error }) {
        if (data) {
            this.fullAddress = data.fields.Shipping_Full_Address__c?.value || '';
            this.cityDistrict = data.fields.City_District__c?.value || '';
            this.parseAddress(this.fullAddress);
        }
    }

    get displayAddress() {
        return this.fullAddress || '';
    }
    
    get hasAddress() {
        return !!this.address;
    }
    
    // 카카오맵 URL (iframe으로 불러오기)
    get mapUrl() {
        if (!this.address) return '';
        
        const encodedAddress = encodeURIComponent(this.address);
        return `https://map.kakao.com/?q=${encodedAddress}`;
    }
    
    parseAddress(fullAddr) {
        if (!fullAddr) return;
        
        const match = fullAddr.match(/\[(\d+)\]\s*(.*)/);
        if (match) {
            this.postalCode = match[1];
            const rest = match[2];
            const parts = rest.split(' ');
            this.address = parts.slice(0, -1).join(' ') || rest;
            this.detailAddress = parts[parts.length - 1] || '';
        }
    }
    
    connectedCallback() {
        window.addEventListener('message', this.handleMessage.bind(this));
    }
    
    disconnectedCallback() {
        window.removeEventListener('message', this.handleMessage.bind(this));
    }
    
    openAddressSearch() {
        const width = 570;
        const height = 600;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        const url = '/apex/KakaoAddressPopup';
        
        const popup = window.open(
            url,
            'addressSearch',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
        
        if (!popup) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: '팝업 차단',
                    message: '팝업 차단을 해제해주세요',
                    variant: 'warning'
                })
            );
        }
    }
    
    handleMessage(event) {
        if (event.data && event.data.type === 'KAKAO_ADDRESS') {
            const data = event.data.data;
            
            this.postalCode = data.zonecode;
            this.address = data.address;
            this.detailAddress = data.detailAddress || '';

            const addressParts = data.address.split(' ');
            if (addressParts.length >= 2) {
                this.cityDistrict = addressParts[0] + ' ' + addressParts[1];
            }
            
            console.log('✅ 주소 선택됨:', data);
            console.log('✅ 시/구:', this.cityDistrict);
            
            this.saveAddress();
        }
    }
    
    saveAddress() {
        if (!this.recordId) return;
        
        let fullAddr = '';
        if (this.postalCode && this.address) {
            fullAddr = `[${this.postalCode}] ${this.address}`;
            if (this.detailAddress) {
                fullAddr += ` ${this.detailAddress}`;
            }
        }
        
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[SHIPPING_ADDRESS_FIELD.fieldApiName] = fullAddr;
        fields[CITY_DISTRICT_FIELD.fieldApiName] = this.cityDistrict;
        
        const recordInput = { fields };
        
        updateRecord(recordInput)
            .then(() => {
                this.fullAddress = fullAddr;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: '성공',
                        message: '주소가 저장되었습니다',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.error('저장 실패:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: '오류',
                        message: '주소 저장 중 오류가 발생했습니다',
                        variant: 'error'
                    })
                );
            });
    }
}