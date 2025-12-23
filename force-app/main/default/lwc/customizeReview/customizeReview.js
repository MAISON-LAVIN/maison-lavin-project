import { LightningElement, api, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { getRecord } from 'lightning/uiRecordApi';
import getProductImage from '@salesforce/apex/ProductCustomizerController.getProductImage';
import getAvailableStores from '@salesforce/apex/ProductCustomizerController.getAvailableStores';

import PRODUCT_NAME from '@salesforce/schema/Product2.Name';
import STORE_NAME from '@salesforce/schema/Store__c.Name';

export default class CustomizeReview extends LightningElement {
    
    // Input: Screen 1에서 받아온 값들
    @api selectedFamily = '';
    @api selectedProductId = '';
    @api initials = '';
    @api selectedColor = '#ffd900ff';
    @api selectedPosition = 'center-top';
    
    // Output: 선택한 매장
    @api selectedStoreId = '';
    
    productImageUrl;
    productName = '';
    storeName = '';
    stores = [];
    isStoreModalOpen = false;
    
    // Product 정보 가져오기
    @wire(getRecord, {
        recordId: '$selectedProductId',
        fields: [PRODUCT_NAME]
    })
    wiredProduct({ data, error }) {
        if (data) {
            this.productName = data.fields.Name.value;
        } else if (error) {
            console.error('제품 정보 로딩 에러:', error);
        }
    }
    
    // Product 이미지 가져오기
    @wire(getProductImage, { productId: '$selectedProductId' })
    wiredProductImage({ data, error }) {
        if (data) {
            this.productImageUrl = data;
        } else if (error) {
            console.error('이미지 로딩 에러:', error);
            this.productImageUrl = null;
        }
    }
    
    // Store 정보 가져오기
    @wire(getRecord, {
        recordId: '$selectedStoreId',
        fields: [STORE_NAME]
    })
    wiredStore({ data, error }) {
        if (data) {
            this.storeName = data.fields.Name.value;
        } else if (error) {
            console.error('매장 정보 로딩 에러:', error);
        }
    }
    
    // 매장 목록 가져오기
    @wire(getAvailableStores)
    wiredStores({ data, error }) {
        if (data) {
            this.stores = data;
        } else if (error) {
            console.error('매장 목록 로딩 에러:', error);
        }
    }
    
    // Flow에 값 전달
    notifyFlow(attributeName, value) {
        this.dispatchEvent(new FlowAttributeChangeEvent(attributeName, value));
    }
    
    // Getters
    get hasStoreSelected() {
        return this.selectedStoreId && this.selectedStoreId.length > 0;
    }
    
    get hasStores() {
        return this.stores && this.stores.length > 0;
    }
    
    get showInitials() {
        return this.initials && this.initials.length > 0;
    }
    
    get positionLabel() {
        const positions = {
            'center-top': '상단',
            'center-bottom': '하단'
        };
        return positions[this.selectedPosition] || '상단';
    }
    
    get colorPreviewStyle() {
        return `background-color: ${this.selectedColor}; width: 30px; height: 30px; border-radius: 4px; border: 1px solid #dddbda; display: inline-block;`;
    }
    
    get positionCoordinates() {
        const coords = {
            'center-top': { top: '30%', left: '50%', size: '30px' },
            'center-bottom': { top: '75%', left: '50%', size: '30px' }
        };
        return coords[this.selectedPosition] || { top: '30%', left: '50%', size: '30px' };
    }
    
    get initialsStyleString() {
        const pos = this.positionCoordinates;
        return `position: absolute; top: ${pos.top}; left: ${pos.left}; color: ${this.selectedColor}; font-size: ${pos.size}; font-weight: bold; transform: translate(-50%, -50%); text-shadow: 2px 2px 4px rgba(0,0,0,0.3); pointer-events: none;`;
    }
    
    // Event Handlers
    openStoreModal() {
        this.isStoreModalOpen = true;
    }
    
    closeStoreModal() {
        this.isStoreModalOpen = false;
    }
    
    handleStoreClick(event) {
        const storeId = event.currentTarget.dataset.id;
        this.selectedStoreId = storeId;
        
        // 선택한 매장 이름 찾기
        const selectedStore = this.stores.find(store => store.Id === storeId);
        if (selectedStore) {
            this.storeName = selectedStore.Name;
        }
        
        // Flow에 전달
        this.notifyFlow('selectedStoreId', this.selectedStoreId);
        // 디버깅용
        console.log('Selected Store ID:', this.selectedStoreId);
        
        // 모달 닫기
        this.closeStoreModal();
    }
}