import { LightningElement, api, track, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import getProductImage from '@salesforce/apex/ProductCustomizerController.getProductImage';
import getProductFamilies from '@salesforce/apex/ProductCustomizerController.getProductFamilies';

export default class ProductCustomizer extends LightningElement {
    @api selectedFamily = '';
    @api selectedProductId = '';
    @api selectedColor = '#ffd900ff';
    @api selectedPosition = 'center-top';
    @api initials = '';
    
    @track productImageUrl = '';
    @track showInitialOptions = false;
    @track showPatchOptions = false;
    @track showEmbroideryOptions = false;
    @track showStudOptions = false;
    @track categoryOptions = [];
    
    positionOptions = [
        { label: '상단', value: 'center-top' },
        { label: '하단', value: 'center-bottom' }
    ];
    
    // Family 목록 동적 로드
    @wire(getProductFamilies)
    wiredFamilies({ data, error }) {
        if (data) {
            this.categoryOptions = data;
        } else if (error) {
            console.error('Error loading families:', error);
            // Fallback: 하드코딩된 값 사용
            this.categoryOptions = [
                { label: '트래블', value: 'Travel' },
                { label: '비즈니스', value: 'Business' }
            ];
        }
    }
    
    connectedCallback() {
        this.notifyFlow('selectedColor', this.selectedColor);
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
    
    // 카테고리 변경
    handleCategoryChange(event) {
        this.selectedFamily = event.detail.value;
        this.selectedProductId = '';
        this.productImageUrl = '';
        this.notifyFlow('selectedFamily', this.selectedFamily);
    }
    
    // 제품 선택
    handleProductSelect(event) {
        this.selectedProductId = event.detail.recordId;
        this.selectedPosition = 'center-top';
        
        // 제품 이미지 로드
        this.loadProductImage();
        
        this.notifyFlow('selectedProductId', this.selectedProductId);
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
    
    // 제품 이미지 로드
    loadProductImage() {
        if (!this.selectedProductId) {
            this.productImageUrl = '';
            return;
        }
        
        getProductImage({ productId: this.selectedProductId })
            .then(imageUrl => {
                if (imageUrl) {
                    this.productImageUrl = imageUrl;
                } else {
                    this.productImageUrl = '';
                    console.log('No image found for product');
                }
            })
            .catch(error => {
                console.error('Error loading product image:', error);
                this.productImageUrl = '';
            });
    }
    
    // 이니셜 토글
    handleInitialToggle() {
        this.showInitialOptions = !this.showInitialOptions;
        if (!this.showInitialOptions) {
            this.initials = '';
            this.notifyFlow('initials', '');
        }
    }
    
    // 패치 토글
    handlePatchToggle() {
        this.showPatchOptions = !this.showPatchOptions;
    }

    // 자수 토글
    handleEmbroideryToggle() {
        this.showEmbroideryOptions = !this.showEmbroideryOptions;
    }

    // 스터드 토글
    handleStudToggle() {
        this.showStudOptions = !this.showStudOptions;
    }
    
    // 이니셜 입력
    handleInitialsChange(event) {
        this.initials = event.detail.value.toUpperCase();
        this.notifyFlow('initials', this.initials);
    }
    
    // 색상 변경
    handleColorChange(event) {
        this.selectedColor = event.detail.value;
        this.notifyFlow('selectedColor', this.selectedColor);
    }
    
    // 위치 변경
    handlePositionChange(event) {
        this.selectedPosition = event.detail.value;
        this.notifyFlow('selectedPosition', this.selectedPosition);
    }
    
    // Flow에 알림
    notifyFlow(attributeName, value) {
        const attributeChangeEvent = new FlowAttributeChangeEvent(attributeName, value);
        this.dispatchEvent(attributeChangeEvent);
    }
    
    // Getters
    get productFilter() {
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
    
    get showInitials() {
        return this.initials && this.initials.length > 0;
    }
    
    get initialButtonVariant() {
        return this.showInitialOptions ? 'brand' : 'neutral';
    }
    
    get patchButtonVariant() {
        return this.showPatchOptions ? 'brand' : 'neutral';
    }

    get embroideryButtonVariant() {
        return this.showEmbroideryOptions ? 'brand' : 'neutral';
    }

    get studButtonVariant() {
        return this.showStudOptions ? 'brand' : 'neutral';
    }
    
    get initialsOverlayClass() {
        return `initials-overlay position-${this.selectedPosition}`;
    }
    
    get initialsStyle() {
        return `color: ${this.selectedColor}; font-size: 24px; font-weight: bold;`;
    }
}