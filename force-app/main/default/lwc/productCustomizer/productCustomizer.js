import { LightningElement, api, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getProductImage from '@salesforce/apex/ProductCustomizerController.getProductImage';

import PRODUCT_OBJECT from '@salesforce/schema/Product2';
import FAMILY_FIELD from '@salesforce/schema/Product2.Family';

export default class ProductCustomizer extends LightningElement {
    
    @api selectedFamily = '';
    @api selectedProductId = '';
    @api initials = '';
    @api selectedColor = '#ffd900ff';
    @api selectedPosition = 'center-top';
    
    productImageUrl;
    _initialized = false;
    familyOptions = [];
    
    // 컴포넌트 로드 시 Default 값 즉시 전달
    connectedCallback() {
        this.notifyFlow('selectedColor', this.selectedColor);
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
    
    // Product2 Object Info 가져오기
    @wire(getObjectInfo, { objectApiName: PRODUCT_OBJECT })
    productObjectInfo;
    
    // Family Picklist 값 가져오기
    @wire(getPicklistValues, {
        recordTypeId: '$productObjectInfo.data.defaultRecordTypeId',
        fieldApiName: FAMILY_FIELD
    })
    wiredFamilyPicklist({ data, error }) {
        if (data) {
            this.familyOptions = data.values.map(item => ({
                label: item.label,
                value: item.value
            }));
        } else if (error) {
            console.error('Family picklist 로딩 에러:', error);
        }
    }
    
    // 제품 이미지 가져오기
    @wire(getProductImage, { productId: '$selectedProductId' })
    wiredProductImage({ data, error }) {
        if (data) {
            this.productImageUrl = data;
        } else if (error) {
            console.error('이미지 로딩 에러:', error);
            this.productImageUrl = null;
        }
    }
    
    // Flow에 값 전달하는 헬퍼 메서드
    notifyFlow(attributeName, value) {
        this.dispatchEvent(new FlowAttributeChangeEvent(attributeName, value));
    }
    
    // Getters
    get hasFamilySelected() {
        return this.selectedFamily && this.selectedFamily.length > 0;
    }
    
    get hasProductSelected() {
        return this.selectedProductId && this.selectedProductId.length > 0;
    }
    
    get productFilter() {
        // Family가 선택되지 않았으면 undefined 반환
        if (!this.selectedFamily) {
            return undefined;
        }
        
        // Family로 Product2 필터링
        return {
            criteria: [
                {
                    fieldPath: 'Family',
                    operator: 'eq',
                    value: this.selectedFamily
                }
            ]
        };
    }
    
    get positionOptions() {
        return [
            { label: '상단', value: 'center-top' },
            { label: '하단', value: 'center-bottom' }
        ];
    }
    
    get hasPositionOptions() {
        return this.hasProductSelected && this.positionOptions.length > 0;
    }
    
    get showInitials() {
        return this.initials && this.initials.length > 0;
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
    handleFamilyChange(event) {
        this.selectedFamily = event.detail.value;
        this.selectedProductId = ''; // 카테고리 변경 시 제품 선택 초기화
        this.productImageUrl = null;
        this._initialized = false;
        
        this.notifyFlow('selectedFamily', this.selectedFamily);
        this.notifyFlow('selectedProductId', ''); // 제품 초기화
    }
    
    handleProductSelect(event) {
        this.selectedProductId = event.detail.recordId;
        this.selectedPosition = 'center-top';
        this._initialized = false; // 새 제품 선택 시 초기화
        
        this.notifyFlow('selectedProductId', this.selectedProductId);
        // 제품 선택 시 position도 다시 전달
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
    
    handleInitialsChange(event) {
        this.initials = event.target.value.toUpperCase();
        this.notifyFlow('initials', this.initials);
    }
    
    handleColorChange(event) {
        this.selectedColor = event.detail.value;
        this.notifyFlow('selectedColor', this.selectedColor);
    }
    
    handlePositionChange(event) {
        this.selectedPosition = event.detail.value;
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
}