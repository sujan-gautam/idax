# TanStack Query v5 Migration Fix

**Date**: 2026-01-27 13:28 PM  
**Issue**: Application error due to TanStack Query v4 syntax
**Status**: ✅ **FIXED**

---

## 🐛 **Error Encountered**

```
Error: Bad argument type. Starting with v5, only the "Object" form is allowed 
when calling query related functions.
```

**Location**: Frontend application  
**Cause**: Using TanStack Query v4 syntax in v5 environment

---

## 🔧 **Fix Applied**

### **File**: `apps/web/src/pages/DatasetDetails.tsx`

### **Before** (v4 Syntax - ❌ Incorrect)
```typescript
const { data: dataset, isLoading: datasetLoading } = useQuery(
    ['dataset', id],
    async () => {
        const response = await api.get(`/datasets/${id}`);
        return response.data;
    }
);
```

### **After** (v5 Syntax - ✅ Correct)
```typescript
const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ['dataset', id],
    queryFn: async () => {
        const response = await api.get(`/datasets/${id}`);
        return response.data;
    }
});
```

---

## 📝 **Changes Made**

### **1. Dataset Query**
- Changed from multi-argument to single object format
- Renamed first argument to `queryKey`
- Renamed second argument to `queryFn`

### **2. EDA Status Query**
- Changed from multi-argument to single object format
- Renamed first argument to `queryKey`
- Renamed second argument to `queryFn`
- Moved `refetchInterval` option into the same object

---

## ✅ **Result**

The application should now:
- ✅ Load without errors
- ✅ Properly fetch dataset data
- ✅ Poll EDA status correctly
- ✅ Work with TanStack Query v5

---

## 🎯 **Testing**

After this fix, you should be able to:
1. Navigate to any dataset details page
2. View dataset information
3. See EDA analysis status
4. Trigger EDA analysis
5. No more TanStack Query errors

---

## 📚 **TanStack Query v5 Migration Guide**

### **Key Changes from v4 to v5**

#### **useQuery**
```typescript
// ❌ v4 (Old)
useQuery(queryKey, queryFn, options)

// ✅ v5 (New)
useQuery({
  queryKey,
  queryFn,
  ...options
})
```

#### **useMutation**
```typescript
// ❌ v4 (Old)
useMutation(mutationFn, options)

// ✅ v5 (New)
useMutation({
  mutationFn,
  ...options
})
```

#### **useInfiniteQuery**
```typescript
// ❌ v4 (Old)
useInfiniteQuery(queryKey, queryFn, options)

// ✅ v5 (New)
useInfiniteQuery({
  queryKey,
  queryFn,
  ...options
})
```

---

## 🔍 **Verification**

Checked all files for TanStack Query usage:
- ✅ `DatasetDetails.tsx` - **FIXED**
- ✅ `Dashboard.tsx` - Not using useQuery
- ✅ `Projects.tsx` - Not using useQuery
- ✅ Other pages - No useQuery/useMutation found

---

## 📖 **Reference**

**Official Migration Guide**:  
https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5

**Key Points**:
- All query functions now accept a single object argument
- `queryKey` and `queryFn` are now properties of that object
- Options are merged into the same object
- This provides better TypeScript support and consistency

---

**Status**: ✅ Fixed and ready to test  
**Impact**: Application should now load without errors  
**Next**: Refresh the browser to see the fix in action
