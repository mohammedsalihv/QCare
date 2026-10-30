export const roleOptions = [
 {value:'SuperAdmin',label:'Superadmin'}, {value:'admin',label:'Admin'}, {value:'QualityManager',label:'Quality Manager'}, {value:'QualityOfficer',label:'Quality Officer'}, {value:'user',label:'User'}
];
export const roleLabel = role => roleOptions.find(item=>item.value===role)?.label || ({Quality:'Quality Manager',superadmin:'Superadmin',Staff:'User'})[role] || role;
