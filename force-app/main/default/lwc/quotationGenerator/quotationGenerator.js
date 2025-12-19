import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import getProductInfo from '@salesforce/apex/QuotationController.getProductInfo';
import getDesignFiles from '@salesforce/apex/QuotationController.getDesignFiles';
import createQuotation from '@salesforce/apex/QuotationController.createQuotation';

import SELECTED_PRODUCT from '@salesforce/schema/Opportunity.Selected_Product__c';
import DESIGN_TYPE from '@salesforce/schema/Opportunity.Design_Type__c';

export default class QuotationGenerator extends LightningElement {
    @api recordId;
    
    @track designOptions = [
        { label: '이니셜', value: 'Initial', price: 500000, selected: false },
        { label: '패치', value: 'Patch', price: 600000, selected: false },
        { label: '자수', value: 'Embroidery', price: 800000, selected: false },
        { label: '스터드', value: 'Stud', price: 900000, selected: false }
    ];
    
    @track designFiles = [];
    @track selectedDesignId = null;
    @track selectedDesignUrl = null;
    
    productId = null;
    productName = '';
    productPrice = 0;
    isDragOver = false;
    
    wiredOpportunityResult;
    
    // Opportunity 로드
    @wire(getRecord, {
        recordId: '$recordId',
        fields: [SELECTED_PRODUCT, DESIGN_TYPE]
    })
    wiredOpportunity(result) {
        this.wiredOpportunityResult = result;
        
        if (result.data) {
            this.productId = result.data.fields.Selected_Product__c.value;
            
            // 기존 선택된 디자인 타입
            const existingTypes = result.data.fields.Design_Type__c.value;
            if (existingTypes) {
                const types = existingTypes.split(', ');
                this.designOptions = this.designOptions.map(option => ({
                    ...option,
                    selected: types.includes(option.value)
                }));
            }
            
            if (this.productId) {
                this.loadProductInfo();
                this.loadDesignFiles();
            }
        } else if (result.error) {
            console.error('Error loading opportunity:', result.error);
        }
    }
    
    // 제품 정보 로드
    loadProductInfo() {
        getProductInfo({ productId: this.productId })
            .then(result => {
                this.productName = result.name;
                this.productPrice = result.price || 0;
            })
            .catch(error => {
                console.error('Error loading product:', error);
                this.showToast('오류', '제품 정보를 불러올 수 없습니다', 'error');
            });
    }
    
    // 시안 파일 로드
    loadDesignFiles() {
        getDesignFiles({ opportunityId: this.recordId })
            .then(result => {
                this.designFiles = result;
            })
            .catch(error => {
                console.error('Error loading files:', error);
            });
    }
    
    // 디자인 옵션 선택
    handleDesignTypeChange(event) {
        const value = event.target.value;
        const isChecked = event.target.checked;
        
        this.designOptions = this.designOptions.map(option => {
            if (option.value === value) {
                return { ...option, selected: isChecked };
            }
            return option;
        });
    }
    
    // 드래그 시작
    handleDragStart(event) {
        event.dataTransfer.setData('contentDocId', event.currentTarget.dataset.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    
    // 드래그 오버
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        this.isDragOver = true;
    }
    
    // 드래그 나감
    handleDragLeave() {
        this.isDragOver = false;
    }
    
    // 드롭
    handleDrop(event) {
        event.preventDefault();
        this.isDragOver = false;
        
        const contentDocId = event.dataTransfer.getData('contentDocId');
        const file = this.designFiles.find(f => f.id === contentDocId);
        
        if (file) {
            this.selectedDesignId = file.id;
            this.selectedDesignUrl = file.downloadUrl;
        }
    }
    
    // 시안 선택 취소
    handleRemoveDesign() {
        this.selectedDesignId = null;
        this.selectedDesignUrl = null;
    }
    
    // 견적서 생성
    handleGenerateQuotation() {
        const selectedTypes = this.designOptions
            .filter(opt => opt.selected)
            .map(opt => opt.value)
            .join(', ');
        
        if (!selectedTypes) {
            this.showToast('오류', '디자인 옵션을 선택해주세요', 'error');
            return;
        }
        
        if (!this.selectedDesignId) {
            this.showToast('오류', '최종 시안을 선택해주세요', 'error');
            return;
        }
        
        const data = {
            opportunityId: this.recordId,
            designType: selectedTypes,
            selectedDesignId: this.selectedDesignId,
            totalAmount: this.totalAmount
        };
        
        createQuotation({ data: JSON.stringify(data) })
            .then(() => {
                this.showToast('성공', '견적서가 생성되었습니다', 'success');
                return refreshApex(this.wiredOpportunityResult);
            })
            .catch(error => {
                console.error('Error creating quotation:', error);
                this.showToast('오류', error.body?.message || '견적서 생성 중 오류가 발생했습니다', 'error');
            });
    }
    
    // Toast 메시지
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
    
    // Getters
    get hasDesignFiles() {
        return this.designFiles.length > 0;
    }
    
    get hasSelectedDesign() {
        return this.selectedDesignId !== null;
    }
    
    get dropZoneClass() {
        let classes = 'drop-zone slds-text-align_center slds-p-around_large';
        if (this.isDragOver) {
            classes += ' drag-over';
        }
        if (this.hasSelectedDesign) {
            classes += ' has-design';
        }
        return classes;
    }
    
    get selectedDesignTypes() {
        return this.designOptions
            .filter(opt => opt.selected)
            .map(opt => ({
                ...opt,
                formattedPrice: this.formatCurrency(opt.price)
            }));
    }
    
    get designSurcharge() {
        return this.designOptions
            .filter(opt => opt.selected)
            .reduce((sum, opt) => sum + opt.price, 0);
    }
    
    get totalAmount() {
        return this.productPrice + this.designSurcharge;
    }
    
    get formattedProductPrice() {
        return this.formatCurrency(this.productPrice);
    }
    
    get formattedTotalAmount() {
        return this.formatCurrency(this.totalAmount);
    }
    
    get isGenerateDisabled() {
        const hasSelectedTypes = this.designOptions.some(opt => opt.selected);
        return !hasSelectedTypes || !this.selectedDesignId;
    }
    
    // 포맷팅
    formatCurrency(value) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(value || 0);
    }
    
    // 디자인 옵션에 가격 표시 추가
    get designOptionsWithFormattedPrice() {
        return this.designOptions.map(opt => ({
            ...opt,
            labelWithPrice: `${opt.label}`
        }));
    }
}