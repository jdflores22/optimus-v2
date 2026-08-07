# Workflow UAT scripts (T7.2)

Execute in order against a fresh seeded DB (`Admin123!`). Check boxes during manual UAT.

## Cargo chain

1. [ ] SL Staff creates manifest  
2. [ ] Declare consignee + broker  
3. [ ] Generate NOA  
4. [ ] Generate or upload BL  
5. [ ] Accounting generates billing  
6. [ ] Broker/Consignee submits final payment + receipt  
7. [ ] Accounting validates → `PaymentVerified`

## eDO/CRO

1. [ ] SL Staff generate eDO/CRO (or batch)  
2. [ ] Broker submits eDO payment  
3. [ ] Accounting validates  
4. [ ] Terminal/Admin release  
5. [ ] Public `/verify/{token}`  
6. [ ] Renewal request → review → detention note → renewed eDO  
7. [ ] Expire/unlock path

## Yard

1. [ ] Terminals + CY allocation  
2. [ ] Container inventory allocate  
3. [ ] Trucker pre-advice + geotag photo  
4. [ ] Terminal verify/complete  
5. [ ] Dwell monitor / pause / process job  
6. [ ] Utilization export

## Ops satellites

1. [ ] Broker SAS submit → Evaluator → SL Admin final  
2. [ ] Suspend broker → appeal approve  
3. [ ] Consignee transfer request → staff approve  
4. [ ] Repositioning create → approve → complete  
5. [ ] Referral generate/apply + onboarding step

## Platform

1. [ ] Notifications prefs + mark read + push subscribe  
2. [ ] eDO release metrics export  
3. [ ] Admin settings / rate rules / templates  
4. [ ] Maintenance run  
5. [ ] PWA manifest / install prompt (HTTPS or localhost)
