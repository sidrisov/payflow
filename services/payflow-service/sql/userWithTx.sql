SELECT distinct(u.username) from user u 
inner join flow f on f.user_id = u.id 
inner join wallet w on w.flow_id = f.id 
where w.deployed = true
