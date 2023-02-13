/* eslint-disable no-empty-pattern */
/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionFunctionMap, assign } from 'xstate'

import {
  Context,
  ItemsLoadedEvent,
  MachineEvents,
  SelectDishEvent,
  SelectedDishViewTypeEvent,
  SelectMealEvent,
  SelectRestaurantEvent,
  SetNumberOfPeopleEvent,
  SetNumberOfServings,
  UpdateDishOptionsEvent,
  UpdateMealOptionsEvent,
  UpdateRestaurantOptionsEvent,
} from '../types'

export const actions: ActionFunctionMap<Context, MachineEvents | any> = {
  assignItems: assign({
    items: ({ items = [] }, { payload }: ItemsLoadedEvent) => [
      ...items,
      ...payload,
    ],
  }),

  assignMealOptions: assign({
    options: ({ options }, { payload }: ItemsLoadedEvent) => {
      const meals: string[] = []

      payload?.forEach((item) =>
        item?.availableMeals.forEach((i) => meals.push(i))
      )

      const uniqueAvailableMeals = [...new Set(meals)]

      return {
        ...options,
        availableMealOptions: uniqueAvailableMeals,
      }
    },
  }),

  assignRestaurantOptions: assign({
    options: ({ options }, { payload }: UpdateRestaurantOptionsEvent) => ({
      ...(options ?? {}),
      restaurantOptions: payload,
    }),
  }),

  assignDishOptions: assign({
    options: ({ options }, { payload }: UpdateDishOptionsEvent) => ({
      ...(options ?? {}),
      dishOptions: payload,
    }),
  }),

  assignSelectedMeal: assign({
    selectedMeal: (_, { payload }: SelectMealEvent) => payload?.value,
    selectedRestaurant: (
      { selectedMeal, selectedRestaurant },
      { payload }: SelectMealEvent
    ) => {
      // clicking previous, if meal is change and has already selected a restaurant
      if (selectedRestaurant && selectedMeal !== payload?.value) {
        return ''
      }

      return selectedRestaurant
    },
    options: ({ options, items = [] }, { payload }: SelectMealEvent) => {
      const filteredRestaurants = items
        ?.filter((item) => item.availableMeals?.includes(payload.value))
        ?.map((item) => item.restaurant)

      return {
        ...options,
        restaurantOptions: [...new Set(filteredRestaurants)],
      }
    },
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: false,
      errorText: '',
    }),
  }),

  assignNumberOfPeople: assign({
    selectedNumberOfPeople: (_, { payload }: SetNumberOfPeopleEvent) => payload,
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: false,
      errorText: '',
    }),
  }),

  assignSelectedRestaurant: assign({
    selectedRestaurant: (_, { payload }: SelectRestaurantEvent) =>
      payload.value,
    selectedDishes: (
      { selectedRestaurant, selectedDishes = [] },
      { payload }: SelectRestaurantEvent
    ) => {
      // clicking previous, if restaurant is change and has already selected a restaurant
      if (selectedDishes?.length && selectedRestaurant !== payload.value) {
        return []
      }

      return selectedDishes
    },
    options: (
      { options, items = [], selectedMeal = '' },
      { payload }: SelectRestaurantEvent
    ) => {
      const filteredDishes = items?.filter(
        (item) =>
          item.availableMeals?.includes(selectedMeal) &&
          item.restaurant === payload.value
      )

      return {
        ...options,
        dishOptions: [...new Set(filteredDishes)],
        dishOptionsFixed: [...new Set(filteredDishes)],
      }
    },
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: false,
      errorText: '',
    }),
  }),

  assignDish: assign({
    selectedDishes: ({ selectedDishes = [] }, { payload }: SelectDishEvent) => {
      const hasPendingDish =
        selectedDishes[selectedDishes?.length - 1]?.id === 0

      if (hasPendingDish) {
        selectedDishes?.forEach((dish) => {
          if (dish.id === 0) {
            return {
              ...dish,
              ...payload,
              servings: 1,
            }
          }
        })
      }

      const updatedDishes = selectedDishes?.length
        ? selectedDishes?.map((dish, index) => {
            if (index === payload.index) {
              return {
                ...payload,
                servings: 1,
              }
            }

            return dish
          })
        : [
            ...selectedDishes,
            {
              ...payload,
              servings: 1,
            },
          ]

      return updatedDishes
    },

    options: (
      {
        items = [],
        options,
        selectedDishes = [],
        selectedDishesViewType = 'list',
      },
      { payload }: SelectDishEvent
    ) => {
      const { id } = payload ?? {}
      const { dishOptions = [] } = options ?? {}

      const currentDish = selectedDishes[payload.index]

      const reAddOption = items.find((item) => item.id === currentDish?.id)

      const filteredDishOptions = dishOptions.filter(
        (dish) => dish?.id !== payload?.id
      )

      if (reAddOption) {
        filteredDishOptions.push(reAddOption)
      }

      return {
        ...options,
        dishOptions: filteredDishOptions ?? [],
      }
    },
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: false,
      errorText: '',
    }),
  }),

  removeDish: assign({
    selectedDishes: ({ selectedDishes = [] }, { payload }: SelectDishEvent) => {
      const { id } = payload ?? {}

      const updatedDishes = selectedDishes?.filter((dish) => dish.id !== id)

      return updatedDishes ?? []
    },

    options: (
      { items = [], options, selectedDishes = [] },
      { payload }: SelectDishEvent
    ) => {
      const { id } = payload ?? {}
      const { dishOptions = [] } = options ?? {}

      const currentDish = selectedDishes?.find((dish) => dish.id === id)

      const reAddOption = items.find((item) => item.id === currentDish?.id)

      const filteredDishOptions = dishOptions.filter(
        (dish) => dish?.id !== payload?.id
      )

      if (reAddOption) {
        filteredDishOptions.push(reAddOption)
      }

      return {
        ...options,
        dishOptions: filteredDishOptions ?? [],
      }
    },
  }),

  assignServings: assign({
    selectedDishes: (
      { selectedDishes = [] },
      { payload }: SetNumberOfServings
    ) => {
      const { id } = payload

      const updatedDishes = selectedDishes?.map((dish) => {
        if (dish.id === id) {
          return payload
        }

        return dish
      })

      return updatedDishes ?? []
    },
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: false,
      errorText: '',
    }),
  }),

  trimSelectedDishes: assign({
    selectedDishes: ({ selectedDishes = [] }) =>
      // dish.id === 0
      selectedDishes?.filter((dish) => dish.label !== 'Select an option') ?? [],
  }),

  addDishSelector: assign({
    selectedDishes: ({ selectedDishes = [] }) => {
      const hasPendingDish =
        selectedDishes[selectedDishes?.length - 1]?.id === 0

      if (hasPendingDish) return selectedDishes

      return [
        ...selectedDishes,
        {
          id: 0,
          label: 'Select an option',
          value: '',
          servings: 0,
        },
      ]
    },
  }),

  assignNoSelectedMealError: assign({
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: true,
      errorText: 'Meal is required.',
    }),
  }),

  assignMaxPeopleReachedError: assign({
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: true,
      errorText: "You've reached the maximum number of people.",
    }),
  }),

  assignNoSelectedNumberOfPeople: assign({
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: true,
      errorText: 'Number of people required.',
    }),
  }),

  assignNoSelectedRestaurantError: assign({
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: true,
      errorText: 'Restaurant is required.',
    }),
  }),

  assignNoSelectedDishError: assign({
    errorFields: ({ errorFields }) => ({
      ...errorFields,
      error: true,
      errorText: 'Please select a dish.',
    }),
  }),

  assignNotEnoughDishForPeopleError: assign({
    errorFields: ({ errorFields, selectedNumberOfPeople }) => ({
      ...errorFields,
      error: true,
      errorText: `Not enough dish for ${selectedNumberOfPeople} people.`,
    }),
  }),

  assignDishViewType: assign({
    selectedDishesViewType: ({}, { payload }: SelectedDishViewTypeEvent) =>
      payload,
  }),

  resetContext: assign({
    errorFields: ({}) => ({
      error: false,
      errorText: '',
    }),
    items: ({}) => [],
    options: ({}) => ({
      availableMealOptions: [],
      restaurantOptions: [],
      dishOptions: [],
      dishOptionsFixed: [],
    }),
    selectedDishes: ({}) => [],
    selectedMeal: ({}) => '',
    selectedNumberOfPeople: ({}) => 1,
    selectedRestaurant: ({}) => '',
  }),

  removeError: assign({
    errorFields: ({}) => ({
      error: false,
      errorText: '',
    }),
  }),

  logResult: (context) => {
    const {
      selectedDishes,
      selectedMeal,
      selectedNumberOfPeople,
      selectedRestaurant,
    } = context
    console.log(
      '🍕 Output:',
      JSON.stringify(
        {
          selectedDishes,
          selectedMeal,
          selectedNumberOfPeople,
          selectedRestaurant,
        },
        null,
        2
      )
    )
  },
}
