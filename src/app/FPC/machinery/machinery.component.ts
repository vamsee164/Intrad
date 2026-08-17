import { Component, OnInit, OnDestroy, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User } from '../../services/auth.service';
import { TranslatePipe } from '../../shared/translate.pipe';

declare var bootstrap: any;

interface MachineryItem {
  id: number;
  name: string;
  category: string;
  categoryKey: string;
  price: number;
  rateType: 'hour' | 'day';
  image: string;
  description: string;
  specs: string[];
  available: boolean;
}

@Component({
  selector: 'app-machinery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './machinery.component.html',
  styleUrls: ['./machinery.component.css']
})
export class MachineryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  isLoggedIn = false;

  // Selected Category filter
  selectedCategory = 'all';

  // Modal & Detail States
  selectedMachine: MachineryItem | null = null;
  activeImageIndex = 0;
  
  // Inquiry Form Data
  inquiryData = {
    duration: '',
    startDate: '',
    notes: '',
    guestName: '',
    guestPhone: '',
    guestEmail: ''
  };

  successTitle = '';
  successMessage = '';

  @ViewChild('inquiryForm') inquiryForm!: NgForm;

  readonly categories = [
    { code: 'all', labelKey: 'machinery.category.all' },
    { code: 'tractors', labelKey: 'machinery.category.tractors' },
    { code: 'harvesting', labelKey: 'machinery.category.harvesting' },
    { code: 'cultivation', labelKey: 'machinery.category.cultivation' },
    { code: 'sowing', labelKey: 'machinery.category.sowing' },
    { code: 'protection', labelKey: 'machinery.category.protection' },
    { code: 'logistics', labelKey: 'machinery.category.logistics' }
  ];

  readonly machineryItems: MachineryItem[] = [
    {
      id: 1,
      name: 'Mahindra Arjun Novo 605',
      category: 'tractors',
      categoryKey: 'machinery.category.tractors',
      price: 800,
      rateType: 'hour',
      image: 'assets/images/tractor.png',
      description: 'Powerful and reliable utility tractor suitable for heavy farming tasks, deep ploughing, and heavy trolley transportation.',
      specs: ['57 HP Di Engine', '4-Wheel Drive (4WD)', '2200 kg Lift Capacity', 'Synchromesh Transmission'],
      available: true
    },
    {
      id: 2,
      name: 'John Deere W70 Harvester',
      category: 'harvesting',
      categoryKey: 'machinery.category.harvesting',
      price: 2200,
      rateType: 'hour',
      image: 'assets/images/harvester.png',
      description: 'High-efficiency multi-crop combine harvester designed for grain collection with minimal waste and maximum cleaning efficiency.',
      specs: ['100 HP Turbocharged Engine', '4-Meter Cutter Bar', 'Grain Tank Capacity: 2800L', 'Adjustable Rotor Speed'],
      available: true
    },
    {
      id: 3,
      name: 'Heavy Duty Reversible Disc Plough',
      category: 'cultivation',
      categoryKey: 'machinery.category.cultivation',
      price: 400,
      rateType: 'hour',
      image: 'assets/images/plough.png',
      description: 'Top-tier hydraulic reversible disc plough built to handle trashy and stony conditions, preparing the field with optimum soil mixing.',
      specs: ['3-Bottom Disc Arrangement', 'High Carbon Steel Blades', 'Depth Control up to 30cm', 'Required HP: 50+'],
      available: true
    },
    {
      id: 4,
      name: 'Pneumatic Precision Seed Drill',
      category: 'sowing',
      categoryKey: 'machinery.category.sowing',
      price: 500,
      rateType: 'hour',
      image: 'assets/images/seeder.png',
      description: 'Precision seed drill sower ensuring uniform sowing depth, correct spacing, and seed protection for outstanding germination results.',
      specs: ['9-Row Sowing Mechanism', 'Combined Fertilizer Box', 'Electronic Seed Monitor', 'Adjustable Seed Metering'],
      available: false
    },
    {
      id: 5,
      name: 'Tractor Mounted Boom Sprayer',
      category: 'protection',
      categoryKey: 'machinery.category.protection',
      price: 600,
      rateType: 'hour',
      image: 'assets/images/sprayer.png',
      description: 'High-volume crop protection sprayer with robust booms for uniform coverage of liquid pesticides, nutrients, and herbicides.',
      specs: ['600 Liters Tank Capacity', '12-Meter Boom Width', 'Triplex Diaphragm Pump', 'Anti-Drip Spray Nozzles'],
      available: true
    },
    {
      id: 6,
      name: 'Farm Cargo Cargo-King Lorry',
      category: 'logistics',
      categoryKey: 'machinery.category.logistics',
      price: 1500,
      rateType: 'day',
      image: 'assets/images/lorry.png',
      description: 'Sturdy medium-duty farm logistics transport truck, ideal for safely hauling crop crates, fertilizers, and produce to local markets.',
      specs: ['7-Ton Payload Capacity', '6-Cylinder Diesel Engine', 'All-Terrain Rear Dual Wheels', 'Reinforced Drop-Side Panels'],
      available: true
    }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isLoggedIn = !!user;
        },
        error: (error) => {
          console.error('Error fetching auth state in MachineryComponent:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredMachinery(): MachineryItem[] {
    if (this.selectedCategory === 'all') {
      return this.machineryItems;
    }
    return this.machineryItems.filter(item => item.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  // --- Lightbox / Details Overlay ---
  openLightbox(machine: MachineryItem): void {
    this.selectedMachine = machine;
    this.activeImageIndex = this.machineryItems.findIndex(m => m.id === machine.id);
    
    // Open Bootstrap Modal
    this.showModal('lightboxModal');
  }

  closeLightbox(): void {
    this.hideModal('lightboxModal');
    this.selectedMachine = null;
  }

  nextImage(): void {
    const list = this.filteredMachinery;
    if (list.length <= 1) return;
    
    const currentIndex = list.findIndex(m => m.id === this.selectedMachine?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    this.selectedMachine = list[nextIndex];
  }

  prevImage(): void {
    const list = this.filteredMachinery;
    if (list.length <= 1) return;
    
    const currentIndex = list.findIndex(m => m.id === this.selectedMachine?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    this.selectedMachine = list[prevIndex];
  }

  // --- Inquiry Operations ---
  openInquiry(machine: MachineryItem, event: Event): void {
    event.stopPropagation(); // Prevent opening the lightbox
    this.selectedMachine = machine;
    
    // Reset Form Data
    this.inquiryData = {
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      guestName: this.currentUser?.name || '',
      guestPhone: this.currentUser?.phone || '',
      guestEmail: this.currentUser?.email || ''
    };

    // Close Lightbox if open
    this.hideModal('lightboxModal');
    
    // Open Inquiry Modal
    this.showModal('inquiryModal');
  }

  submitInquiry(): void {
    if (this.inquiryForm.invalid) {
      this.inquiryForm.form.markAllAsTouched();
      return;
    }

    const payload = {
      machineId: this.selectedMachine?.id,
      machineName: this.selectedMachine?.name,
      inquiryDate: new Date().toISOString(),
      details: { ...this.inquiryData },
      user: this.isLoggedIn ? {
        uid: this.currentUser?.id,
        name: this.currentUser?.name,
        email: this.currentUser?.email,
        phone: this.currentUser?.phone
      } : {
        name: this.inquiryData.guestName,
        email: this.inquiryData.guestEmail,
        phone: this.inquiryData.guestPhone
      }
    };

    // Console logs should not lose end-to-end data (retaining full inquiry object details)
    console.log('Machinery Rent Inquiry submitted:', JSON.stringify(payload, null, 2));

    this.successTitle = 'Inquiry Submitted';
    this.successMessage = `Your inquiry for the ${this.selectedMachine?.name} has been received! Our support team will reach out to you within 24 hours.`;

    this.hideModal('inquiryModal');
    this.showModal('successModalMachinery');

    // Reset Form
    if (this.inquiryForm) {
      this.inquiryForm.resetForm();
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/homepage']);
  }

  // --- Modal Helpers ---
  private showModal(id: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const el = document.getElementById(id);
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.show();
        }
      } catch (err) {
        console.error(`Error displaying modal ${id}:`, err);
      }
    }
  }

  private hideModal(id: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const el = document.getElementById(id);
        if (el) {
          const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
          modal.hide();
        }
      } catch (err) {
        console.error(`Error hiding modal ${id}:`, err);
      }
    }
  }

  trackByFn(index: number, item: any): any {
    return item?.id || item?.code || index;
  }
}
