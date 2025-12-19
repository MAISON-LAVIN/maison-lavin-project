import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class ProductCustomizeFlowWrapper extends LightningElement {
  userEmail;
  flowStarted = false;

  @wire(CurrentPageReference)
  setCurrentPageReference(pageRef) {
    if (!pageRef) return;

    // Experience에서 queryStringParameters로 오는 경우가 많음
    const email =
      (pageRef.state && (pageRef.state.email || pageRef.state.userEmail)) || '';

    this.userEmail = (email || '').trim();

    // 이메일이 있고, 아직 Flow 시작 안 했으면 시작
    if (this.userEmail && !this.flowStarted) {
      this.flowStarted = true;

      const inputVariables = [
        { name: 'userEmail', type: 'String', value: this.userEmail }
      ];

      // 렌더 이후 flow 엘리먼트를 잡아서 startFlow
      Promise.resolve().then(() => {
        const flow = this.template.querySelector('lightning-flow');
        flow.startFlow('Product_Customization_Order', inputVariables);
      });
    }
  }
}