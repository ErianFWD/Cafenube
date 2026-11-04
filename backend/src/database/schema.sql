create table categorias (
 id int auto_increment primary key,
 nombre varchar(80) not null unique,
 descripcion varchar(300),
 constraint chk_categoria_nombre check (char_length(trim(nombre)) between 2 and 80)
) engine=innodb;
create table productos (
 id int auto_increment primary key,
 categoria_id int not null,
 nombre varchar(100) not null unique,
 descripcion varchar(300),
 precio decimal(10,2) not null,
 constraint chk_producto_nombre check (char_length(trim(nombre)) between 2 and 100),
 constraint chk_producto_precio check (precio between 0 and 1000000),
 constraint fk_producto_categoria foreign key (categoria_id) references categorias(id) on delete restrict
) engine=innodb;
create table clientes (
 id int auto_increment primary key,
 nombre varchar(100) not null,
 telefono varchar(30),
 correo varchar(120) unique,
 constraint chk_cliente_nombre check (char_length(trim(nombre)) between 2 and 100)
) engine=innodb;
create table metodos_pago (
 id int auto_increment primary key,
 nombre varchar(80) not null unique,
 descripcion varchar(300),
 constraint chk_metodo_nombre check (char_length(trim(nombre)) between 2 and 80)
) engine=innodb;
create table ventas (
 id int auto_increment primary key,
 cliente_id int,
 metodo_pago_id int not null,
 fecha datetime(3) not null,
 observaciones varchar(300),
 constraint fk_venta_cliente foreign key (cliente_id) references clientes(id) on delete restrict,
 constraint fk_venta_metodo foreign key (metodo_pago_id) references metodos_pago(id) on delete restrict,
 index idx_ventas_fecha (fecha)
) engine=innodb;
create table detalle_ventas (
 id int auto_increment primary key,
 venta_id int not null,
 producto_id int not null,
 cantidad int not null,
 precio_unitario decimal(10,2) not null,
 constraint chk_detalle_cantidad check (cantidad between 1 and 999),
 constraint chk_detalle_precio check (precio_unitario between 0 and 1000000),
 constraint uq_venta_producto unique (venta_id, producto_id),
 constraint fk_detalle_venta foreign key (venta_id) references ventas(id) on delete cascade,
 constraint fk_detalle_producto foreign key (producto_id) references productos(id) on delete restrict
) engine=innodb;
