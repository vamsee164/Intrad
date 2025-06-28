import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';

declare var bootstrap: any;

interface FormData {
  name: string;
  typicalCrops: string;
  village: string;
  waterSource: string;
  mandal: string;
  soilTest: string;
  aadharNo: string;
  soilType: string;
  acreOfLand: string;
  fertilizers: string;
}

interface LeaseData {
  landType: string;
  soilType: string;
  areaAcres: string;
  waterSource: string;
  totalYears: string;
  roadDistance: string;
  borewellCount?: string;
  canalWaterDuration?: string;
  wellWaterAcres?: string;
}

interface RentData {
  equipmentType: string;
  rentDuration: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
})
export class HomepageComponent implements OnInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeEventListeners();
      this.updateUIForLoginState(false);
    }
  }

  private initializeEventListeners(): void {
    const simulateLoginBtn = this.document.getElementById(
      'simulate-login-btn'
    ) as HTMLButtonElement;
    const logoutBtn = this.document.getElementById(
      'logoutBtn'
    ) as HTMLButtonElement;
    const signupFormModal = this.document.getElementById(
      'signup-form-modal'
    ) as HTMLFormElement;
    const leaseForm = this.document.getElementById(
      'lease-form'
    ) as HTMLFormElement;
    const rentForm = this.document.getElementById(
      'rent-form'
    ) as HTMLFormElement;
    const leaseWaterSourceSelect = this.document.getElementById(
      'leaseWaterSource'
    ) as HTMLSelectElement;

    if (simulateLoginBtn) {
      simulateLoginBtn.addEventListener('click', () => this.handleLogin());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    if (signupFormModal) {
      signupFormModal.addEventListener('submit', (event) =>
        this.handleSignup(event)
      );
    }

    if (leaseForm) {
      leaseForm.addEventListener('submit', (event) =>
        this.handleLeaseSubmission(event)
      );
    }

    if (rentForm) {
      rentForm.addEventListener('submit', (event) =>
        this.handleRentSubmission(event)
      );
    }

    if (leaseWaterSourceSelect) {
      leaseWaterSourceSelect.addEventListener('change', () =>
        this.toggleLeaseWaterSourceQuestions()
      );
      this.toggleLeaseWaterSourceQuestions();
    }
  }

  private updateUIForLoginState(isLoggedIn: boolean): void {
    const preLoginContent = this.document.getElementById('pre-login-content');
    const categoryButtonsSection = this.document.getElementById(
      'category-buttons-section'
    );
    const servicesPackagesSection = this.document.getElementById(
      'services-packages-section'
    );
    const logoutNavItem = this.document.getElementById('logoutNavItem');
    const loginMessage = this.document.getElementById('login-message');

    if (isLoggedIn) {
      preLoginContent?.classList.add('d-none');
      categoryButtonsSection?.classList.add('d-none');
      servicesPackagesSection?.classList.remove('d-none');
      logoutNavItem?.classList.remove('d-none');
    } else {
      preLoginContent?.classList.remove('d-none');
      categoryButtonsSection?.classList.remove('d-none');
      servicesPackagesSection?.classList.add('d-none');
      logoutNavItem?.classList.add('d-none');
      loginMessage?.classList.add('d-none');
    }
  }

  private handleLogin(): void {
    const usernameInput = this.document.getElementById(
      'username'
    ) as HTMLInputElement;
    const passwordInput = this.document.getElementById(
      'password'
    ) as HTMLInputElement;
    const loginMessage = this.document.getElementById('login-message');

    const username = usernameInput?.value || '';
    const password = passwordInput?.value || '';

    console.log('Simulating Login...');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);

    loginMessage?.classList.remove('d-none', 'alert-success', 'alert-danger');

    if (username === 'user' && password === 'pass') {
      loginMessage?.classList.add('alert-success');
      if (loginMessage) loginMessage.textContent = 'Login successful!';
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
      this.updateUIForLoginState(true);
    } else {
      loginMessage?.classList.add('alert-danger');
      if (loginMessage)
        loginMessage.textContent = 'Invalid username or password.';
    }
  }

  private handleLogout(): void {
    this.updateUIForLoginState(false);
    console.log('Logged out.');
  }

  private handleSignup(event: Event): void {
    event.preventDefault();

    const formData: FormData = {
      name:
        (this.document.getElementById('modalName') as HTMLInputElement)
          ?.value || '',
      typicalCrops:
        (this.document.getElementById('modalTypicalCrops') as HTMLInputElement)
          ?.value || '',
      village:
        (this.document.getElementById('modalVillage') as HTMLInputElement)
          ?.value || '',
      waterSource:
        (this.document.getElementById('modalWaterSource') as HTMLInputElement)
          ?.value || '',
      mandal:
        (this.document.getElementById('modalMandal') as HTMLInputElement)
          ?.value || '',
      soilTest:
        (this.document.getElementById('modalSoilTest') as HTMLInputElement)
          ?.value || '',
      aadharNo:
        (this.document.getElementById('modalAadharNo') as HTMLInputElement)
          ?.value || '',
      soilType:
        (this.document.getElementById('modalSoilType') as HTMLInputElement)
          ?.value || '',
      acreOfLand:
        (this.document.getElementById('modalAcreOfLand') as HTMLInputElement)
          ?.value || '',
      fertilizers:
        (this.document.getElementById('modalFertilizers') as HTMLInputElement)
          ?.value || '',
    };

    console.log('Sign Up Form Submitted:', formData);

    try {
      const signupModal = new bootstrap.Modal(
        this.document.getElementById('signupModal')
      );
      const successModal = new bootstrap.Modal(
        this.document.getElementById('successModal')
      );
      const signupFormModal = this.document.getElementById(
        'signup-form-modal'
      ) as HTMLFormElement;

      signupModal.hide();
      successModal.show();
      signupFormModal?.reset();
    } catch (error) {
      console.error('Bootstrap not loaded:', error);
    }
  }

  private toggleLeaseWaterSourceQuestions(): void {
    const leaseWaterSourceSelect = this.document.getElementById(
      'leaseWaterSource'
    ) as HTMLSelectElement;
    const leaseBorewellQuestion = this.document.getElementById(
      'leaseBorewellQuestion'
    );
    const leaseCanalQuestion =
      this.document.getElementById('leaseCanalQuestion');
    const leaseWellQuestion = this.document.getElementById('leaseWellQuestion');

    const selectedSource = leaseWaterSourceSelect?.value || '';

    if (leaseBorewellQuestion) {
      leaseBorewellQuestion.style.display =
        selectedSource === 'borewell' ? 'block' : 'none';
    }
    if (leaseCanalQuestion) {
      leaseCanalQuestion.style.display =
        selectedSource === 'canal' ? 'block' : 'none';
    }
    if (leaseWellQuestion) {
      leaseWellQuestion.style.display =
        selectedSource === 'well' ? 'block' : 'none';
    }
  }

  private handleLeaseSubmission(event: Event): void {
    event.preventDefault();

    const leaseData: LeaseData = {
      landType:
        (this.document.getElementById('leaseLandType') as HTMLInputElement)
          ?.value || '',
      soilType:
        (this.document.getElementById('leaseSoilType') as HTMLInputElement)
          ?.value || '',
      areaAcres:
        (this.document.getElementById('leaseAreaAcres') as HTMLInputElement)
          ?.value || '',
      waterSource:
        (this.document.getElementById('leaseWaterSource') as HTMLSelectElement)
          ?.value || '',
      totalYears:
        (this.document.getElementById('leaseTotalYears') as HTMLInputElement)
          ?.value || '',
      roadDistance:
        (this.document.getElementById('leaseRoadDistance') as HTMLInputElement)
          ?.value || '',
    };

    const leaseBorewellQuestion = this.document.getElementById(
      'leaseBorewellQuestion'
    );
    const leaseCanalQuestion =
      this.document.getElementById('leaseCanalQuestion');
    const leaseWellQuestion = this.document.getElementById('leaseWellQuestion');

    if (leaseBorewellQuestion?.style.display === 'block') {
      leaseData.borewellCount =
        (this.document.getElementById('leaseBorewellCount') as HTMLInputElement)
          ?.value || '';
    }
    if (leaseCanalQuestion?.style.display === 'block') {
      leaseData.canalWaterDuration =
        (
          this.document.getElementById(
            'leaseCanalWaterDuration'
          ) as HTMLInputElement
        )?.value || '';
    }
    if (leaseWellQuestion?.style.display === 'block') {
      leaseData.wellWaterAcres =
        (
          this.document.getElementById(
            'leaseWellWaterAcres'
          ) as HTMLInputElement
        )?.value || '';
    }

    console.log('Lease Form Submitted:', leaseData);

    try {
      const submissionSuccessModal = new bootstrap.Modal(
        this.document.getElementById('successModal')
      );
      const successModalLabel =
        this.document.getElementById('successModalLabel');
      const successModalBody = this.document.querySelector(
        '#successModal .modal-body'
      );
      const leaseForm = this.document.getElementById(
        'lease-form'
      ) as HTMLFormElement;

      if (successModalLabel) successModalLabel.textContent = 'Lease Inquiry';
      if (successModalBody)
        successModalBody.textContent =
          'Your lease inquiry has been submitted successfully!';

      submissionSuccessModal.show();
      leaseForm?.reset();
      this.toggleLeaseWaterSourceQuestions();
    } catch (error) {
      console.error('Bootstrap not loaded:', error);
    }
  }

  private handleRentSubmission(event: Event): void {
    event.preventDefault();

    const rentData: RentData = {
      equipmentType:
        (this.document.getElementById('rentEquipmentType') as HTMLSelectElement)
          ?.value || '',
      rentDuration:
        (this.document.getElementById('rentDuration') as HTMLInputElement)
          ?.value || '',
    };

    console.log('Rent Form Submitted:', rentData);

    try {
      const submissionSuccessModal = new bootstrap.Modal(
        this.document.getElementById('successModal')
      );
      const successModalLabel =
        this.document.getElementById('successModalLabel');
      const successModalBody = this.document.querySelector(
        '#successModal .modal-body'
      );
      const rentForm = this.document.getElementById(
        'rent-form'
      ) as HTMLFormElement;

      if (successModalLabel) successModalLabel.textContent = 'Rent Inquiry';
      if (successModalBody)
        successModalBody.textContent =
          'Your rent inquiry has been submitted successfully!';

      submissionSuccessModal.show();
      rentForm?.reset();
    } catch (error) {
      console.error('Bootstrap not loaded:', error);
    }
  }
}
