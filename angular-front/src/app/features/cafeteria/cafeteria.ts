import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components';

type Meal = 'Lunch' | 'Snack' | 'Dinner';
type DietaryFilter = 'all' | 'vegetarian' | 'vegan';

interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
  dietary: ('vegetarian' | 'vegan')[];
}

interface MenuDay {
  date: Date;
  closed: boolean;
  items: Record<Meal, MenuItem[]>;
}

@Component({
  selector: 'app-cafeteria',
  imports: [DatePipe, PageHeaderComponent],
  templateUrl: './cafeteria.html',
  styleUrl: './cafeteria.scss',
})
export class Cafeteria {
  readonly meals: Meal[] = ['Lunch', 'Snack', 'Dinner'];
  readonly selectedDay = signal(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  readonly selectedMeal = signal<Meal>('Lunch');
  readonly dietaryFilter = signal<DietaryFilter>('all');

  readonly days: MenuDay[] = this.createMenu();
  readonly selectedItems = computed(() => {
    const day = this.days[this.selectedDay()];
    if (day.closed) {
      return [];
    }

    const items = day.items[this.selectedMeal()];
    const filter = this.dietaryFilter();

    return filter === 'all' ? items : items.filter((item) => item.dietary.includes(filter));
  });

  setDay(index: number): void {
    this.selectedDay.set(index);
  }

  setMeal(meal: Meal): void {
    this.selectedMeal.set(meal);
  }

  setDietaryFilter(filter: DietaryFilter): void {
    this.dietaryFilter.set(filter);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  private createMenu(): MenuDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

    const meals: Record<Meal, MenuItem[]> = {
      Lunch: [
        {
          name: 'Grilled chicken bowl',
          description: 'Herb chicken, rice, roasted vegetables and yogurt sauce',
          allergens: ['Milk'],
          dietary: [],
        },
        {
          name: 'Mediterranean lentil bowl',
          description: 'Lentils, couscous, cucumber, tomato and tahini dressing',
          allergens: ['Gluten', 'Sesame'],
          dietary: ['vegetarian', 'vegan'],
        },
        {
          name: 'Tomato basil pasta',
          description: 'Penne, tomato sauce, basil and parmesan',
          allergens: ['Gluten', 'Milk'],
          dietary: ['vegetarian'],
        },
        {
          name: 'Beef kefta plate',
          description: 'Seasoned beef kefta, bulgur, salad and roasted vegetables',
          allergens: ['Gluten'],
          dietary: [],
        },
        {
          name: 'Tuna niçoise salad',
          description: 'Tuna, potatoes, green beans, tomato and olives',
          allergens: ['Fish', 'Eggs'],
          dietary: [],
        },
      ],
      Snack: [
        {
          name: 'Fresh fruit cup',
          description: 'A mix of seasonal fruit',
          allergens: [],
          dietary: ['vegetarian', 'vegan'],
        },
        {
          name: 'Chocolate cookie',
          description: 'Soft-baked cookie with dark chocolate chips',
          allergens: ['Gluten', 'Milk', 'Eggs'],
          dietary: ['vegetarian'],
        },
        {
          name: 'Hummus and vegetable sticks',
          description: 'Creamy chickpea hummus with carrot and cucumber',
          allergens: ['Sesame'],
          dietary: ['vegetarian', 'vegan'],
        },
      ],
      Dinner: [
        {
          name: 'Vegetable curry',
          description: 'Coconut curry, chickpeas, seasonal vegetables and rice',
          allergens: [],
          dietary: ['vegetarian', 'vegan'],
        },
        {
          name: 'Baked fish & potatoes',
          description: 'Oven-baked fish, potatoes and green beans',
          allergens: ['Fish'],
          dietary: [],
        },
        {
          name: 'Chicken shawarma plate',
          description: 'Marinated chicken, rice, salad and garlic sauce',
          allergens: ['Milk'],
          dietary: [],
        },
        {
          name: 'Spinach and ricotta lasagna',
          description: 'Pasta, spinach, ricotta and tomato sauce',
          allergens: ['Gluten', 'Milk', 'Eggs'],
          dietary: ['vegetarian'],
        },
      ],
    };

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { date, closed: index === 6, items: meals };
    });
  }
}
