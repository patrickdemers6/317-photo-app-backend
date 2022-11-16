/**
 * An example valid and invalid JWT and its associated email and sub
 */
exports.token =
  'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc3Y2MwZWY0YzcxODFjZjRjMGRjZWY3YjYwYWUyOGNjOTAyMmM3NmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2NjcwNTg5NDQsImF1ZCI6IjM5NjE1NzQzOTg4OC0xc2tqbjVpdnQ3bDh1MGRwZW5sMDJrZjNzMTdubjJ0di5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMDE3NzgxNDk0ODExNDI1MTkzNSIsImVtYWlsIjoicGF0cmlja2RlbWVyczZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF6cCI6IjM5NjE1NzQzOTg4OC0xc2tqbjVpdnQ3bDh1MGRwZW5sMDJrZjNzMTdubjJ0di5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsIm5hbWUiOiJQYXRyaWNrIERlbWVycyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BTG01d3UwVkQ5Yl80RVUwQmZCWm55N2xvVjBrRUpKbUVnYTIyVGwyd0tpb1Q1bz1zOTYtYyIsImdpdmVuX25hbWUiOiJQYXRyaWNrIiwiZmFtaWx5X25hbWUiOiJEZW1lcnMiLCJpYXQiOjE2NjcwNTkyNDQsImV4cCI6MTY2NzA2Mjg0NCwianRpIjoiNTE3Nzg5MmIxYWIzMDQ0ODY2NzEwNzgyZjIxZWJiNzJmMGE1MmM1YSJ9.IEd_qJlY3c_T558MrC4unCWN_3Z-dJp3NXsBrQ6awayVPpZWqV1gqwY-IoruWemzIdw2UBUoPa9-Son14YX1v5emmuSyyBg49Tqkh0FNOie8aYmmhS-HWjeHu7y6aeE_u82JC-Mw3KWksPvu1tOhG14NXpzldbVrSrQ3RDkGsfQFLZZY9bdDYtuWeJVcyFgVOfqX4TmT9ISZuYo9-ZW5nFmfOzlUq7_8P8J7D2iLZyyl29SG1B3S3Jm01lwuMFiqpc51EXesBmThyCuvvCabbXcSTfcybdXAYKSIiRr5UR-JRI8b79DlKootcZfRoy0nVmVwy4UpGEPzb6dMQVjemw';
exports.tokenEmail = 'patrickdemers6@gmail.com';
exports.tokenSub = '110177814948114251935';
exports.invalidToken =
  'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjeasuhaensuhYzcxODFjZjRjMGRjZWY3YjYwYWUyOGNjOTAyMmM3NmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2NjcwNTg5NDQsImF1ZCI6IjM5NjE1NzQzOTg4OC0xc2tqbjVpdnQ3bDh1MGRwZW5sMDJrZjNzMTdubjJ0di5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMDE3NzgxNDk0ODExNDI1MTkzNSIsImVtYWlsIjoicGF0cmlja2RlbWVyczZAZ21haWwuY29staehuanethumVyaWZpZWQiOnRydWUsImF6cCI6IjM5NjE1NzQzOTg4OC0xc2tqbjVpdnQ3bDh1MGRwZW5sMDJrZjNzMTdubjJ0di5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsIm5hbWUiOiJQYXRyaWNrIERlbWVycyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BTG01d3UwVkQ5Yl80RVUwQmZCWm55N2xvVjBrRUpKbUVnYTIyVGwyd0tpb1Q1bz1zOTYtYyIsImdpdmVuX25hbWUiOiJQYXRyaWNrIiwiZmFtaWx5X25hbWUiOiJEZW1lcnMiLCJpYXQiOjE2NjcwNTkyNDQsImV4cCI6MTY2NzA2Mjg0NCwianRpIjoiNTE3Nzg5MmIxYWIzMDQ0ODY2NzEwNzgyZjIxZWJiNzJmMGE1MmM1YSJ9.IEd_qJlY3c_T558MrC4unCWN_3Z-dJp3NXsBrQ6awayVPpZWqV1gqwY-IoruWemzIdw2UBUoPa9-Son14YX1v5emmuSyyBg49Tqkh0FNOie8aYmmhS-HWjeHu7y6aeE_u82JC-Mw3KWksPvu1tOhG14NXpzldbVrSrQ3RDkGsfQFLZZY9bdDYtuWeJVcyFgVOfqX4TmT9ISZuYo9-ZW5nFmfOzlUq7_8P8J7D2iLZyyl29SG1B3S3Jm01lwuMFiqpc5ARUCsBmThyCuvvCabbXcSTfcybdXAYKSIiRr5UR-JRI8b79DlKootcZfRoy0nVmVwy4UpGEPzb6dMQVjemw';
