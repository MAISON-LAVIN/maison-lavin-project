import { LightningElement } from 'lwc';
import basePath from '@salesforce/community/basePath';
import createLead from '@salesforce/apex/ExperienceLeadController.createLead';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LeadCapture extends LightningElement {
    firstName = '';
    lastName = '';
    salutation = ''; // Salutation(표준 Picklist)

    phone = '';
    email = '';

    shippingFullAddress = '';
    cityDistrict = '';

    // 동의 체크박스 상태
    telephoneOptIn = false;
    emailOptIn = false;
    smsOptIn = false;
    consentDataUsage = false;

    isSaving = false;
    _boundMessageHandler;

    connectedCallback() {
        this._boundMessageHandler = this.handleMessage.bind(this);
        window.addEventListener('message', this._boundMessageHandler);
    }

    disconnectedCallback() {
        window.removeEventListener('message', this._boundMessageHandler);
    }

    // lightning-input/combobox의 표준 이벤트(detail.value) + 예외(target.value) 모두 처리
    getValue(e) {
        return (e?.detail?.value ?? e?.target?.value ?? '').toString();
    }

    handleFirstName(e) { this.firstName = this.getValue(e); }
    handleLastName(e) { this.lastName = this.getValue(e); }
    handlePhone(e) { this.phone = this.getValue(e); }
    handleEmail(e) { this.email = this.getValue(e); }

    // Salutation Picklist 값은 org의 실제 픽리스트 값과 정확히 일치해야 저장됨
    get salutationOptions() {
        return [
            { label: '남성', value: 'Mr.' },
            { label: '여성', value: 'Ms.' },
            { label: 'none', value: 'Mrs.' }
        ];
    }

    handleSalutation(e) {
        this.salutation = this.getValue(e);
    }

    handleTelephoneOptIn(e) { this.telephoneOptIn = e.target.checked; }
    handleEmailOptIn(e) { this.emailOptIn = e.target.checked; }
    handleSmsOptIn(e) { this.smsOptIn = e.target.checked; }
    handleConsentDataUsage(e) { this.consentDataUsage = e.target.checked; }

    // 유지: /s 제거 로직 포함
    openAddressSearch() {
        const width = 570;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const origin = window.location.origin;
        const sitePrefix = basePath.replace(/\/s$/, '');
        const url = `${origin}${sitePrefix}/apex/KakaoAddressPopup`;

        window.open(
            url,
            'kakaoAddressSearch',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
    }

    handleMessage(event) {
        if (!event?.data || event.data.type !== 'KAKAO_ADDRESS') return;

        const data = event.data.data || {};
        const zonecode = data.zonecode || '';
        const address = data.address || '';
        const detail = data.detailAddress || '';

        this.shippingFullAddress =
            `[${zonecode}] ${address}${detail ? ' ' + detail : ''}`;

        const parts = address.split(' ').filter(Boolean);
        this.cityDistrict = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || '';
    }

    // blur 없이 최신 입력값을 확보하기 위해 DOM에서 직접 읽음
    readInputsBeforeSave() {
        const lastNameEl = this.template.querySelector('[data-id="lastName"]');
        const firstNameEl = this.template.querySelector('[data-id="firstName"]');
        const salutationEl = this.template.querySelector('[data-id="salutation"]');
        const phoneEl = this.template.querySelector('[data-id="phone"]');
        const emailEl = this.template.querySelector('[data-id="email"]');

        this.lastName = (lastNameEl?.value || '').toString();
        this.firstName = (firstNameEl?.value || '').toString();
        this.salutation = (salutationEl?.value || '').toString();
        this.phone = (phoneEl?.value || '').toString();
        this.email = (emailEl?.value || '').toString();
    }

    async handleSave() {
        this.readInputsBeforeSave();

        if (!this.lastName.trim()) {
            this.showToast('오류', '성을 입력해주세요.', 'error');
            return;
        }

        this.isSaving = true;

        try {
            await createLead({
                firstName: this.firstName,
                lastName: this.lastName,
                salutation: this.salutation,
                phone: this.phone,
                email: this.email,
                shippingFullAddress: this.shippingFullAddress,
                cityDistrict: this.cityDistrict,
                telephoneOptIn: this.telephoneOptIn,
                emailOptIn: this.emailOptIn,
                smsOptIn: this.smsOptIn,
                consentDataUsage: this.consentDataUsage
            });

            this.showToast('성공', '고객 정보가 저장되었습니다.', 'success');
        } catch (e) {
            this.showToast('오류', e?.body?.message || '저장 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isSaving = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}