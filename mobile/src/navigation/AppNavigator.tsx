import React, { useState } from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  BarChart3,
  LayoutGrid,
} from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'

// Screens
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ExpensesScreen } from '../screens/ExpensesScreen'
import { MonthlyBudgetScreen } from '../screens/MonthlyBudgetScreen'
import { AnalyticsScreen } from '../screens/AnalyticsScreen'
import { RecurringBillsScreen } from '../screens/RecurringBillsScreen'
import { AIAdvisorScreen } from '../screens/AIAdvisorScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { UdharScreen } from '../screens/UdharScreen'
import { ShoppingScreen } from '../screens/ShoppingScreen'
import { ReportsScreen } from '../screens/ReportsScreen'
import { EventPlanningScreen } from '../screens/EventPlanningScreen'
import { MoreFeaturesDrawer } from '../components/MoreFeaturesDrawer'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Empty component for 'More' tab since it triggers the drawer
const DummyScreen = () => <View />

const MainTabs = ({ navigation }: { navigation: any }) => {
  const { colors } = useAppTheme()
  const [drawerVisible, setDrawerVisible] = useState(false)

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0F1523',
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 6,
            paddingTop: 6,
            elevation: 8,
          },
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={20} strokeWidth={2} />,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Expenses"
          component={ExpensesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={20} strokeWidth={2} />,
            tabBarLabel: 'Expenses',
          }}
        />
        <Tab.Screen
          name="Budget"
          component={MonthlyBudgetScreen}
          options={{
            tabBarIcon: ({ color, size }) => <PieChart color={color} size={20} strokeWidth={2} />,
            tabBarLabel: 'Budget',
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={20} strokeWidth={2} />,
            tabBarLabel: 'Analytics',
          }}
        />
        <Tab.Screen
          name="More"
          component={DummyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault()
              setDrawerVisible(true)
            },
          }}
          options={{
            tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={20} strokeWidth={2} />,
            tabBarLabel: 'More',
          }}
        />
      </Tab.Navigator>

      {/* More Features Bottom Sheet Modal */}
      <MoreFeaturesDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onNavigate={(screen) => navigation.navigate(screen)}
      />
    </>
  )
}

export const AppNavigator = () => {
  const { user } = useAuth()
  const { colors } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!user ? (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Subscriptions"
            component={RecurringBillsScreen}
            options={{
              headerShown: true,
              title: 'Subscriptions & Recurring',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="Udhar"
            component={UdharScreen}
            options={{
              headerShown: true,
              title: 'Udhar & Debt Ledger',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="Shopping"
            component={ShoppingScreen}
            options={{
              headerShown: true,
              title: 'Shopping Lists & Planner',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="AI Advisor"
            component={AIAdvisorScreen}
            options={{
              headerShown: true,
              title: 'AI Financial Advisor',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="EventPlanning"
            component={EventPlanningScreen}
            options={{
              headerShown: true,
              title: 'Event & Trip Planning',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              headerShown: true,
              title: 'Reports & Statements',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Settings & Profile',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 16 },
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
