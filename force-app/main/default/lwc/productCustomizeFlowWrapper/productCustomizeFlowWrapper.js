import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class ProductCustomizeFlowWrapper extends LightningElement {
  userEmail;
  lastStartedEmail;

  @wire(CurrentPageReference)
  setCurrentPageReference(pageRef) {
    if (!pageRef) return;

    const email =
      (pageRef.state && (pageRef.state.email || pageRef.state.userEmail)) || '';

    const normalized = (email || '').trim();

    if (!normalized) return;

    // 같은 이메일로는 재시작하지 않음
    if (this.lastStartedEmail === normalized) return;

    this.userEmail = normalized;
    this.lastStartedEmail = normalized;

    const inputVariables = [
      { name: 'userEmail', type: 'String', value: this.userEmail }
    ];

    Promise.resolve().then(() => {
      const flow = this.template.querySelector('lightning-flow');
      if (!flow) return;

      try {
        flow.startFlow('Product_Customization_Order', inputVariables);
      } catch (e) {
        // 필요하면 콘솔로만 확인
        // eslint-disable-next-line no-console
        console.error('Failed to start flow:', e);
      }
    });
  }

  handleStatusChange(event) {
    // eslint-disable-next-line no-console
    console.log('Flow status:', event.detail.status);
    // FINISHED / FINISHED_SCREEN / ERROR 등을 여기서 확인 가능
  }
}