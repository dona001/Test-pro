# Code Cleanup Analysis

## 📊 Package Analysis

### 🗑️ **Unused Dependencies (Can be removed)**

#### **Frontend Dependencies:**
1. **`@tanstack/react-query`** - Only imported but never used
   - Used in: `src/App.tsx` (QueryClient, QueryClientProvider)
   - Status: ❌ Unused - Can be removed

2. **`swagger-parser`** - Not used anywhere
   - Status: ❌ Unused - Can be removed

3. **`html2canvas`** - Not used anywhere
   - Status: ❌ Unused - Can be removed

4. **`jspdf`** - Not used anywhere
   - Status: ❌ Unused - Can be removed

5. **`vaul`** - Not used anywhere
   - Status: ❌ Unused - Can be removed

6. **`react-day-picker`** - Not used anywhere
   - Status: ❌ Unused - Can be removed

#### **Backend Dependencies:**
All backend dependencies are being used:
- ✅ `express` - Used in server.js
- ✅ `cors` - Used in server.js
- ✅ `axios` - Used in server.js
- ✅ `helmet` - Used in server.js
- ✅ `express-rate-limit` - Used in server.js
- ✅ `compression` - Used in server.js

### 🔍 **Used Dependencies (Keep)**

#### **Frontend Dependencies:**
- ✅ `jszip` - Used in BitbucketIntegration.tsx
- ✅ `date-fns` - Used in TestReportPanel.tsx
- ✅ `next-themes` - Used in sonner.tsx
- ✅ `react-syntax-highlighter` - Used in RequestPanel.tsx
- ✅ `lucide-react` - Used extensively
- ✅ `@radix-ui/*` - Used extensively
- ✅ `tailwindcss` - Used extensively
- ✅ `react-router-dom` - Used extensively

## 🧹 **UI Components Analysis**

### ✅ **Used UI Components:**
- `alert.tsx` - Used in CORSErrorDisplay.tsx, ErrorBoundary.tsx
- `badge.tsx` - Used extensively
- `button.tsx` - Used extensively
- `card.tsx` - Used extensively
- `checkbox.tsx` - Used in MultiEndpointExecution.tsx
- `collapsible.tsx` - Used in multiple components
- `dialog.tsx` - Used in modals
- `input.tsx` - Used extensively
- `label.tsx` - Used extensively
- `popover.tsx` - Used in ValueSelector.tsx
- `scroll-area.tsx` - Used in multiple components
- `select.tsx` - Used extensively
- `separator.tsx` - Used in TestReportPanel.tsx
- `sonner.tsx` - Used in App.tsx
- `tabs.tsx` - Used in multiple components
- `textarea.tsx` - Used in RequestPanel.tsx, EndpointConfigModal.tsx
- `toast.tsx` - Used in App.tsx
- `toaster.tsx` - Used in App.tsx
- `tooltip.tsx` - Used in App.tsx

### ❌ **Unused UI Components:**
- `command.tsx` - Not used anywhere
- `use-toast.ts` - Not used (replaced by sonner)

## 📁 **Utility Files Analysis**

### ✅ **Used Utilities:**
- `fileParser.ts` - Used in SmartImport.tsx
- `testCodeGenerator.ts` - Used in TestCodeGenerator.tsx
- `allureReporter.ts` - Used in TestReportPanel.tsx
- `extentReporter.ts` - Used in TestReportPanel.tsx

### ✅ **Used Types:**
- `validation.ts` - Used in multiple components

## 🚀 **Cleanup Recommendations**

### **1. Remove Unused Dependencies**

```bash
# Remove unused frontend dependencies
npm uninstall @tanstack/react-query swagger-parser html2canvas jspdf vaul react-day-picker
```

### **2. Remove Unused UI Components**

```bash
# Remove unused UI components
rm src/components/ui/command.tsx
rm src/components/ui/use-toast.ts
```

### **3. Clean Up App.tsx**

Remove unused QueryClient setup:
```tsx
// Remove these lines from App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
<QueryClientProvider client={queryClient}>
```

### **4. Update package.json**

Remove unused dependencies from package.json after uninstalling.

## 📈 **Impact Analysis**

### **Bundle Size Reduction:**
- **@tanstack/react-query**: ~50KB
- **swagger-parser**: ~200KB
- **html2canvas**: ~150KB
- **jspdf**: ~300KB
- **vaul**: ~50KB
- **react-day-picker**: ~100KB
- **command.tsx**: ~10KB
- **use-toast.ts**: ~2KB

**Total potential reduction: ~862KB**

### **Maintenance Benefits:**
- ✅ Reduced bundle size
- ✅ Fewer dependencies to maintain
- ✅ Cleaner codebase
- ✅ Faster build times
- ✅ Reduced security vulnerabilities

## 🎯 **Action Plan**

1. **Remove unused dependencies**
2. **Remove unused UI components**
3. **Clean up App.tsx**
4. **Update documentation**
5. **Test functionality**
6. **Commit changes**

## ⚠️ **Before Removing**

**Test these features to ensure they're not used:**
- Query functionality (if any)
- PDF generation
- HTML to canvas conversion
- Date picker functionality
- Command palette functionality
- Toast notifications (check if use-toast is used anywhere) 