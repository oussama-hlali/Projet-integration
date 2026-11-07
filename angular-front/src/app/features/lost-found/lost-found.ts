import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components';

type ItemStatus = 'FOUND' | 'LOST';
type ItemCategory = 'Electronics' | 'Cards & IDs' | 'Clothing' | 'Keys' | 'Other';

interface LostFoundItem {
  id: number;
  title: string;
  description: string;
  status: ItemStatus;
  category: ItemCategory;
  location: string;
  date: Date;
  reporter: string;
  contact: string;
}

@Component({
  selector: 'app-lost-found',
  imports: [DatePipe, PageHeaderComponent],
  templateUrl: './lost-found.html',
  styleUrl: './lost-found.scss',
})
export class LostFound {
  readonly statuses: { value: ItemStatus; label: string }[] = [
    { value: 'FOUND', label: 'Found items' },
    { value: 'LOST', label: 'Lost items' },
  ];
  readonly categories: ItemCategory[] = ['Electronics', 'Cards & IDs', 'Clothing', 'Keys', 'Other'];
  readonly selectedStatus = signal<ItemStatus>('FOUND');
  readonly search = signal('');
  readonly selectedCategory = signal<'all' | ItemCategory>('all');
  readonly showReportForm = signal(false);
  readonly reportVersion = signal(0);

  readonly items: LostFoundItem[] = [
    {
      id: 1,
      title: 'Black wireless headphones',
      description: 'Black over-ear headphones in a soft grey case.',
      status: 'FOUND',
      category: 'Electronics',
      location: 'Library, second floor',
      date: new Date(2026, 10, 6),
      reporter: 'Nour Ben Ali',
      contact: 'nour.benali@smartcampus.test',
    },
    {
      id: 2,
      title: 'Student card',
      description: 'Student card found near the cafeteria entrance.',
      status: 'FOUND',
      category: 'Cards & IDs',
      location: 'Cafeteria entrance',
      date: new Date(2026, 10, 5),
      reporter: 'Campus reception',
      contact: 'reception@smartcampus.test',
    },
    {
      id: 3,
      title: 'Blue water bottle',
      description: 'Blue metal bottle with a small university sticker.',
      status: 'FOUND',
      category: 'Other',
      location: 'Sports hall',
      date: new Date(2026, 10, 3),
      reporter: 'Youssef Khelifi',
      contact: 'youssef.khelifi@smartcampus.test',
    },
    {
      id: 4,
      title: 'Silver laptop charger',
      description: 'USB-C charger, left in a classroom after the afternoon lecture.',
      status: 'LOST',
      category: 'Electronics',
      location: 'Building B, room 204',
      date: new Date(2026, 10, 6),
      reporter: 'You',
      contact: 'helpdesk@smartcampus.test',
    },
    {
      id: 5,
      title: 'Set of two keys',
      description: 'Two keys on a red key ring.',
      status: 'LOST',
      category: 'Keys',
      location: 'Main campus',
      date: new Date(2026, 10, 4),
      reporter: 'You',
      contact: 'helpdesk@smartcampus.test',
    },
  ];

  readonly filteredItems = computed(() => {
    this.reportVersion();
    const query = this.search().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.items.filter((item) => {
      const matchesStatus = item.status === this.selectedStatus();
      const matchesCategory = category === 'all' || item.category === category;
      const searchable = `${item.title} ${item.description} ${item.location} ${item.reporter}`.toLowerCase();
      return matchesStatus && matchesCategory && (!query || searchable.includes(query));
    });
  });

  setStatus(status: ItemStatus): void {
    this.selectedStatus.set(status);
  }

  countByStatus(status: ItemStatus): number {
    return this.items.filter((item) => item.status === status).length;
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setCategory(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value as 'all' | ItemCategory);
  }

  toggleReportForm(): void {
    this.showReportForm.update((visible) => !visible);
  }

  submitReport(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const location = String(data.get('location') ?? '').trim();
    const reporter = String(data.get('reporter') ?? '').trim();
    const contact = String(data.get('contact') ?? '').trim();
    const status = data.get('status');
    const category = data.get('category');

    if (
      !title ||
      !description ||
      !location ||
      !reporter ||
      !contact ||
      (status !== 'FOUND' && status !== 'LOST') ||
      !this.categories.includes(category as ItemCategory)
    ) {
      return;
    }

    this.items.unshift({
      id: Date.now(),
      title,
      description,
      status,
      category: category as ItemCategory,
      location,
      date: new Date(),
      reporter,
      contact,
    });
    this.selectedStatus.set(status);
    this.selectedCategory.set('all');
    this.reportVersion.update((version) => version + 1);
    form.reset();
    this.showReportForm.set(false);
  }

  contactReporter(item: LostFoundItem): void {
    window.location.href = `mailto:${item.contact}?subject=Smart Campus - ${item.title}`;
  }
}
