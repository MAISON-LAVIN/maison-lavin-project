import { LightningElement, api } from 'lwc';

export default class KakaoAddressSearch extends LightningElement {
    
    @api postalCode = '';
    @api address = '';
    @api detailAddress = '';
    
    showPopup = false;
    
    get hasAddress() {
        return this.address && this.address.length > 0;
    }
    
    // 주소 검색 버튼 클릭
    handleAddressSearch() {
        this.showPopup = true;
        
        // DOM 렌더링 후 iframe 생성
        setTimeout(() => {
            this.createIframe();
        }, 100);
    }
    
    // iframe 생성
    createIframe() {
        const modalContent = this.template.querySelector('.slds-modal__content');
        
        if (!modalContent) return;
        
        // iframe 생성
        const iframe = document.createElement('iframe');
        iframe.src = 'https://postcode.map.daum.net/guide';
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.style.border = 'none';
        
        // 메시지 수신 대기
        window.addEventListener('message', this.handleMessage.bind(this));
        
        modalContent.appendChild(iframe);
    }
    
    // 카카오에서 메시지 수신
    handleMessage(event) {
        // 보안: 카카오에서 온 메시지만 처리
        if (event.origin !== 'https://postcode.map.daum.net') return;
        
        const data = event.data;
        
        if (data.zonecode) {
            this.postalCode = data.zonecode;
            this.address = data.address;
            this.detailAddress = '';
            this.closePopup();
        }
    }
    
    // 팝업 닫기
    closePopup() {
        this.showPopup = false;
        
        // 이벤트 리스너 제거
        window.removeEventListener('message', this.handleMessage);
    }
    
    // 상세 주소 입력
    handleDetailChange(event) {
        this.detailAddress = event.target.value;
    }
    
    disconnectedCallback() {
        // 컴포넌트 제거 시 리스너 정리
        window.removeEventListener('message', this.handleMessage);
    }
}