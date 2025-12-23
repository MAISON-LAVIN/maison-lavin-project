import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LeadAddressSearch extends LightningElement {
  postalCode = '';
  address = '';
  detailAddress = '';
  fullAddress = '';
  cityDistrict = '';

  _boundMessageHandler;

  connectedCallback() {
    this._boundMessageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this._boundMessageHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._boundMessageHandler);
  }

  get displayAddress() {
    return this.fullAddress || '';
  }

  get hasAddress() {
    return !!this.address;
  }

  get mapUrl() {
    if (!this.address) return '';
    const encoded = encodeURIComponent(this.address);
    return `https://map.kakao.com/?q=${encoded}`;
  }

  openAddressSearch() {
    const width = 570;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

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
    // KakaoAddressPopup 쪽에서 postMessage로 넘겨주는 규격을 그대로 사용
    if (event?.data?.type !== 'KAKAO_ADDRESS') return;

    const data = event.data.data || {};
    this.postalCode = data.zonecode || '';
    this.address = data.address || '';
    this.detailAddress = data.detailAddress || '';

    const addressParts = (this.address || '').split(' ');
    if (addressParts.length >= 2) {
      this.cityDistrict = `${addressParts[0]} ${addressParts[1]}`;
    } else {
      this.cityDistrict = '';
    }

    this.fullAddress = this.buildFullAddress();

    // 부모에게 전달
    this.dispatchEvent(
      new CustomEvent('addresschange', {
        detail: {
          postalCode: this.postalCode,
          address: this.address,
          detailAddress: this.detailAddress,
          fullAddress: this.fullAddress,
          cityDistrict: this.cityDistrict
        }
      })
    );
  }

  buildFullAddress() {
    if (!this.postalCode || !this.address) return '';
    let full = `[${this.postalCode}] ${this.address}`;
    if (this.detailAddress) full += ` ${this.detailAddress}`;
    return full;
  }
}